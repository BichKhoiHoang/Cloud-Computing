const image_input = document.querySelector("#image_input");
const frame = document.querySelector("#display_selected_image");

image_input.addEventListener("change", function (event) {
  display_selected_image.innerHTML = "";
  const maxFiles = 5;
  const input = event.target;
  const files = input.files;
  if (files.length > maxFiles) {
    alert(`You can only upload up to ${maxFiles} files.`);
    input.value = ""; // Clear the file input
  }

  for (const file of this.files) {
    const reader = new FileReader();

    reader.addEventListener("load", function () {
      const uploaded_image = reader.result;

      // Create an image element
      const imgElement = document.createElement("img");
      imgElement.src = uploaded_image;
      imgElement.classList.add("uploaded-image"); // Add a class for styling

      // Append the image element to the frame
      frame.appendChild(imgElement);
    });

    reader.readAsDataURL(file);
  }
});
