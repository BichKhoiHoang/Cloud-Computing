const image_input = document.querySelector("#image_input");
const frame = document.querySelector("#display_selected_image");

image_input.addEventListener("change", function () {
  display_selected_image.innerHTML = "";

  for (const file of this.files) {
    const reader = new FileReader();

    reader.addEventListener("load", function () {
      const uploaded_image = reader.result;

      // Create an image element
      const imgElement = document.createElement("img");
      imgElement.src = uploaded_image;
      imgElement.classList.add("flex-auto"); // Add a class for styling

      // Append the image element to the frame
      frame.appendChild(imgElement);
    });

    reader.readAsDataURL(file);
  }
});
