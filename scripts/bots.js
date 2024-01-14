function createNewBot() {
    Swal.fire({
        title: 'Create Bot',
        html:
            '<label for="name">Name</label>' +
            '<input id="name" class="swal2-input" placeholder="Project Name">' +
            '<label for="id">Bot ID</label>' +
            '<input id="id" class="swal2-input" placeholder="Bot ID">' +
            '<label for="token">Token</label>' +
            '<input id="token" class="swal2-input" placeholder="Bot Token">',
        focusConfirm: false,
        showCancelButton: true,
        cancelButtonText: 'Cancel',
        confirmButtonText: 'Create',
        preConfirm: () => {
            const name = Swal.getPopup().querySelector('#name').value;
            const token = Swal.getPopup().querySelector('#token').value;
            const clientID = Swal.getPopup().querySelector('#id').value;

            // Check if both name and token are filled
            if (!name || !token || !clientID) {
                Swal.showValidationMessage('Please fill in both the Name and Token fields');
                return false; // Prevent closing the modal
            }

            // Perform the POST request to /create-bot
            return fetch('/create-bot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    token: token,
                    clientId: clientID,
                }),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log(data);
                Swal.fire('Bot Created!', 'Your bot has been successfully created.', 'success');
                refreshList();
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
                Swal.fire('Error', 'There was an error creating the bot.', 'error');
            });
        },
    });
}



function refreshList() {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', '/fetch-bots', true);
    xhr.send();

    xhr.onload = function () {
        if (xhr.status == 200) {
            let jsonResponse = JSON.parse(xhr.responseText);

            const gridContainer = document.getElementById("grid");
            gridContainer.innerHTML = '';


            const specialButton = document.createElement('div');
            specialButton.classList.add('grid-btn');
            specialButton.id = 'special-button';

            const button = document.createElement('button');
            button.innerText = 'NEW BOT';
            button.id = 'add-bot-button';
            button.onclick = createNewBot;

            specialButton.appendChild(button);
            gridContainer.appendChild(specialButton);

            jsonResponse.forEach(bot => {
                const gridItem = document.createElement('div');
                gridItem.classList.add('grid-btn');

                const button = document.createElement('button');
                button.innerText = bot.name;
                button.dataset.projectID=bot.id;
                button.addEventListener("click", (event)=>{
                    window.location.href=`/projects/${event.target.dataset.projectID}/`
                });


                gridItem.appendChild(button);
                gridContainer.appendChild(gridItem);
            });

        } else {
            console.error('Request failed. Status: ' + xhr.status);
        }
    };
}


document.addEventListener('DOMContentLoaded', function () {
    refreshList();
});