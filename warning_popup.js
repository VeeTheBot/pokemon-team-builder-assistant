/*
    Author: Manhattan Calabro
*/

// Creates a popup warning the user about removing a slot that already has a Pokemon
function warningPopup(slotId) {
    // If a warning popup hasn't been created yet for this slot id...
    let popup;
    if(document.getElementById(`warning-popup-${slotId}`) == null) {
        // Create a new popup
        popup = document.createElement("dialog");
        popup.id = `warning-popup-${slotId}`;
        popup.innerHTML = `
            <p>Would you <em>really</em> like to remove this Pokémon?</p>
            <p>Note: <strong>You won't be able to undo this!</strong></p>
        `;

        document.body.appendChild(popup);
    }
    // Otherwise, fetch the pre-existing popup
    else {
        popup = document.getElementById(`warning-popup-${slotId}`);
    }

    // Show the popup
    popup.showModal();



    // The popup's button container (it's solely for formatting purposes)
    let container;
    if(document.getElementById(`warning-container-${slotId}`) == null) {
        container = document.createElement("div");
        container.id = `warning-container-${slotId}`;
        container.classList.add("warning-container");
        popup.appendChild(container);
    }
    else {
        container = document.getElementById(`warning-container-${slotId}`);
    }
    


    // The popup's cancel button
    let cancelButton;
    if(document.getElementById(`warning-cancel-${slotId}`) == null) {
        cancelButton = document.createElement("button");
        cancelButton.id = `warning-cancel-${slotId}`;
        cancelButton.classList.add("btn");
        cancelButton.innerText = "Cancel";
        container.appendChild(cancelButton);

        // The code to close the popup (i.e., cancel the Pokemon removal operation)
        cancelButton.addEventListener("click", () => {
            popup.close();
        });
    }
    else {
        cancelButton = document.getElementById(`warning-cancel-${slotId}`);
    }



    // The popup's confirm button
    let confirmButton;
    if(document.getElementById(`warning-confirm-${slotId}`) == null) {
        confirmButton = document.createElement("button");
        confirmButton.id = `warning-confirm-${slotId}`;
        confirmButton.classList.add("btn");
        confirmButton.classList.add("btn-remove");
        confirmButton.innerText = "Remove";
        container.appendChild(confirmButton);

        // The code to remove the Pokemon
        confirmButton.addEventListener("click", () => {
            // Closes the popup
            popup.close();
            // Removes the Pokemon
            removeSlot(slotId);
            // Deletes the popup (its existence is defunct without that slot)
            popup.remove();
        });
    }
    else {
        confirmButton = document.getElementById(`warning-confirm-${slotId}`);
    }



    // Adding shared formatting to all of the popup's children
    for(let child of popup.children) {
        child.classList.add("warning-popup");
        for(let grandchild of child.children) {
            grandchild.classList.add("warning-popup");
        }
    }
}