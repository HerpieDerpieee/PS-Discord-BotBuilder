function getProjectId() {
    let currentPage = window.location.href;
    return parseInt(currentPage.split('/projects/')[1].split('/')[0]);
}

function editProjectName(){
    Swal.fire({
        title: 'Enter Project Name',
        html:
            '<input id="projectName" class="swal2-input" placeholder="Project Name">',
        focusConfirm: false,
        preConfirm: () => {
            const name = Swal.getPopup().querySelector('#projectName').value;

            // Check if both name and token are filled
            if (!name) {
                Swal.showValidationMessage('Please fill in all the fields');
                return false; // Prevent closing the modal
            }

            // Perform the POST request to /create-bot
            return fetch('/rename-project', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    id: getProjectId()
                }),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                Swal.fire('Project Rename!', 'Your project has been successfully been renamed.', 'success').then(() => {
                    window.location.reload();
                });
                
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
                Swal.fire('Error', 'There was an error creating the bot.', 'error');
            });
        },
    })
}

function exportProject() {
    Swal.fire({
        title: "Exporting...",
        text: "Your project export is in progress.",
        icon: "info",
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false
    });

    fetch(`/export?id=${getProjectId()}`, { method: 'POST' })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Request failed. Status: ${response.status}`);
            }
            return response.blob();
        })
        .then(blob => {
            // Create a link element
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);

            // Set the download attribute and trigger a click
            link.download = `bot_builds_${getProjectId()}.zip`;
            link.click();

            // Clean up
            window.URL.revokeObjectURL(link.href);

            Swal.close();
            
        })
        .then(() => {
            Swal.fire({
                title: "Exported!",
                text: "Your project has been exported.",
                icon: "success"
            });
            loadData();
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                title: "Export Failed",
                text: "There was an error exporting your project.",
                icon: "error"
            });
        });
}


function createNewCommand() {
    Swal.fire({
        title: 'Create Command',
        html:
            '<label for="name">Command Name</label>' +
            '<input id="name" class="swal2-input" placeholder="Command Name">' +
            '<label for="description">Description</label>' +
            '<input id="description" class="swal2-input" placeholder="Command Description">'+
            '<label for="response">Command Response</label>' +
            '<input id="response" class="swal2-input" placeholder="Command Response">',
        focusConfirm: false,
        showCancelButton: true,
        cancelButtonText: 'Cancel',
        confirmButtonText: 'Create',
        preConfirm: () => {
            const name = Swal.getPopup().querySelector('#name').value;
            const description = Swal.getPopup().querySelector('#description').value;
            const response = Swal.getPopup().querySelector('#response').value;

            // Check if both name and token are filled
            if (!name || !description || !response) {
                Swal.showValidationMessage('Please fill in all the fields');
                return false; // Prevent closing the modal
            }

            // Perform the POST request to /create-bot
            return fetch('/create-command', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    description: description,
                    response: response,
                    projectId: getProjectId()
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
                Swal.fire('Command Created!', 'Your command has been successfully created.', 'success');
                loadData();
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
                Swal.fire('Error', 'There was an error creating the bot.', 'error');
            });
        },
    });
}

function deleteCommand (event) {
    const commandId=event.target.dataset.commandId;
    const projectId = getProjectId();

    Swal.fire({
        title: "Are you sure you want to delete this command?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!"
      }).then((result) => {
        if (result.isConfirmed) {
            let xhr = new XMLHttpRequest();
            xhr.open("POST", `/delete-command?commandId=${commandId}&projectId=${projectId}`);
            xhr.send();
            xhr.onload = () => {
                if (xhr.status == 200){
                    Swal.fire({
                        title: "Deleted!",
                        text: "Your command has been deleted.",
                        icon: "success"
                    })
                    loadData();
                } else {
                    console.error('Request failed. Status: ' + xhr.status);
                }
            }

        }
      });
}


function loadData() {
    let projectId = getProjectId()

    let xhr = new XMLHttpRequest();
    xhr.open('GET', `/fetch-project-data?id=${projectId}`, true);
    xhr.send();
    xhr.onload = () => {
        if (xhr.status == 200){
            
            let jsonResponse = JSON.parse(xhr.responseText);
            if (jsonResponse != {}){
                document.querySelector("#title").innerHTML = jsonResponse.projectName.toUpperCase();
            }
        } else {
            console.error('Request failed. Status: ' + xhr.status);
        }
    }

    let xhr2 = new XMLHttpRequest();
    xhr2.open('GET', `/fetch-commands?id=${projectId}`, true);
    xhr2.send();

    xhr2.onload = function () {
        if (xhr2.status == 200) {
            let jsonResponse = JSON.parse(xhr2.responseText);
            console.log(jsonResponse)

            const gridContainer = document.getElementById("grid");
            gridContainer.innerHTML = '';


            const specialButton = document.createElement('div');
            specialButton.classList.add('grid-btn');
            specialButton.id = 'special-button';

            const button = document.createElement('button');
            button.innerText = 'NEW COMMAND';
            button.id = 'add-command-button';
            button.onclick = createNewCommand;

            specialButton.appendChild(button);
            gridContainer.appendChild(specialButton);

            jsonResponse.forEach(command => {
                const gridItem = document.createElement('div');
                gridItem.classList.add('grid-btn');

                const button = document.createElement('button');
                button.innerHTML = "<strong class='command-bold'>"+command.name+"</strong><br>"+command.description;
                button.dataset.commandId=command.id;
                button.dataset.commandResponse=command.response;
                button.addEventListener("click", (event)=>{
                    deleteCommand(event);
                });


                gridItem.appendChild(button);
                gridContainer.appendChild(gridItem);
            });

        } else {
            console.error('Request failed. Status: ' + xhr2.status);
        }
    };
}



document.addEventListener('DOMContentLoaded', function () {
    loadData();
});