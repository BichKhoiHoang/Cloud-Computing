const image_input = document.querySelector("#image_input");
const frame = document.querySelector("#display_selected_image");
const clear_btn = document.querySelector("#clear_all_button");

clear_btn.addEventListener("click", () => {
  image_input.value = "";
  const images = document.querySelectorAll(".uploaded-image");
  images.forEach((image) => {
    image.remove();
  });
});

image_input.addEventListener("change", function () {
  display_selected_image.innerHTML = "";

  let files = this.files;
  let readers = [];

  if (files.length > 5) {
    Toastify({
      text: "Too many photos! Only 5 allowed",
      duration: 3000,
      close: true,
      gravity: "bottom", // `top` or `bottom`
      position: "right", // `left`, `center` or `right`
    }).showToast();
    image_input.value = "";
    return;
  }

  for (let i = 0; i < files.length; i++) {
    let reader = new FileReader();

    reader.addEventListener("load", function () {
      const uploaded_image = reader.result;

      // Create an image element
      const imgElement = document.createElement("img");
      imgElement.src = uploaded_image;
      imgElement.classList.add("flex-auto"); // Add a class for styling
      imgElement.classList.add("uploaded-image"); // Add a class for styling
      imgElement.style = "height: 16rem;";
      // Append the image element to the frame
      frame.appendChild(imgElement);
    });

    reader.readAsDataURL(files[i]);
    readers.push(reader);
  }
});
