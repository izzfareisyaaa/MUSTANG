const editBtn = document.querySelector(".edit-btn");
let editing = false;

editBtn.addEventListener("click", function () {
  const fields = document.querySelectorAll(".editable");

  if (!editing) {
    fields.forEach(field => {
      const span = field.querySelector("span");
      const value = span.textContent;

      const input = document.createElement("input");
      input.type = "text";
      input.value = value;
      input.className = "edit-input";

      field.replaceChild(input, span);
    });

    editBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save';
    editing = true;

  } else {
    fields.forEach(field => {
      const input = field.querySelector("input");
      const value = input.value;

      const span = document.createElement("span");
      span.textContent = value;

      field.replaceChild(span, input);
    });

    editBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Edit Profile';
    editing = false;
  }
});