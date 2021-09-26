document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Send email
  document.querySelector('form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});



function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#detail-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#detail-view').style.display = 'none';


  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get emails data
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      // Show emails list
      let div = document.createElement('div');
      div.classList.add('list-group');
      emails.forEach(email => {
        let a = document.createElement('a');

        if (!email.read) {
          a.innerHTML = `<div class="ms-2 me-auto">
                          <div class="fw-bold">${email.subject}
                            <span class="badge bg-primary rounded-pill">new</span>
                          </div>
                          ${email.timestamp}
                        </div>`;
        } else {
          a.innerHTML = `<div class="ms-2 me-auto">
                          <div class="fw-bold">${email.subject}
                          </div>
                          ${email.timestamp}
                        </div>`;
        }
        a.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
        div.append(a);

        // Add event listener to a tag
        // Click on a tag can see content of that email
        // The email in sentbox will not show "archive" button on it's detail page
        let email_id = email.id;
        a.addEventListener('click', () => see_email_content(email_id, mailbox));
      });

      document.querySelector('#emails-view').append(div);

    });
}


function send_email(e) {
  let recipients = document.querySelector('#compose-recipients').value;
  let subject = document.querySelector('#compose-subject').value;
  let body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  });
  load_mailbox('sent');
  e.preventDefault();
}

function see_email_content(email_id, mailbox) {
  // Get email data 
  fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
      if (!email.error) {
        // Show email detail
        document.querySelector('#emails-view').style.display = 'none';
        document.querySelector('#compose-view').style.display = 'none';
        document.querySelector('#detail-view').style.display = 'block';
        let detail_view = document.querySelector('#detail-view');
        detail_view.innerHTML =
          `<h4>${email.subject}</h4>
          <p>sender: ${email.sender}</p>
          <p>recipients: ${email.recipients}</p>
          <p>${email.timestamp}</p>
          <p>${email.body}</p>
          <button id="reply" class="btn btn-primary">Reply</button>
          `;

        // Add event listener to reply button
        let reply = document.querySelector('#reply');
        reply.addEventListener('click', () => reply_email(email.sender, email.subject, email.timestamp, email.body));

        // Add "archive" button in inbonx, and "unarchive" button in archivedbox.
        if (mailbox != 'sent') {
          let button = document.createElement('button');
          if (mailbox == 'inbox') {
            button.innerHTML = 'archive';
          } else {
            button.innerHTML = 'unarchive';
          }
          button.classList.add('btn', 'btn-primary');
          detail_view.append(button);
          // Click on archive or unarchive button to change the archive status
          button.addEventListener('click', () => change_archive(email_id));
        }

      }
    });
  // Set email readed
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  });
}


function change_archive(email_id) {
  fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
      if (email.archived) {
        fetch(`/emails/${email_id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: false
          })
        });
      } else {
        fetch(`/emails/${email_id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: true
          })
        });
      }
    });
  load_mailbox('inbox');
}

function reply_email(sender, subject, timestamp, body) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#detail-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = sender;
  if (subject.startsWith('Re: ')) {
    document.querySelector('#compose-subject').value = subject;
  } else {
    document.querySelector('#compose-subject').value = 'Re: ' + subject;
  }
  document.querySelector('#compose-body').value = 'On ' + timestamp + ' ' + sender + ' wrote: ' + body;
  console.log(sender, subject, timestamp, body);
}