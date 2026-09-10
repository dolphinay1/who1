window.addEventListener("DOMContentLoaded", () => {
  const switcher = document.querySelector(".switcher");
  if (switcher) {
    const options = switcher.querySelectorAll(".switcher__option");
    let activeOption = "3"; // LinkedIn is default active

    // Initialize switcher attributes
    switcher.setAttribute("c-option", activeOption);
    switcher.setAttribute("c-previous", activeOption);

    options.forEach((opt) => {
      const optVal = opt.getAttribute("c-option");

      // Slide and stretch active bubble to hovered option
      opt.addEventListener("mouseenter", () => {
        const currentOption = switcher.getAttribute("c-option");
        if (currentOption !== optVal) {
          switcher.setAttribute("c-previous", currentOption);
          switcher.setAttribute("c-option", optVal);
        }
      });

      // Lock current option on click
      opt.addEventListener("click", () => {
        activeOption = optVal;
        switcher.setAttribute("c-previous", activeOption);
        switcher.setAttribute("c-option", activeOption);
      });
    });

    // Revert to locked active option on mouse leave
    switcher.addEventListener("mouseleave", () => {
      const currentOption = switcher.getAttribute("c-option");
      if (currentOption !== activeOption) {
        switcher.setAttribute("c-previous", currentOption);
        switcher.setAttribute("c-option", activeOption);
      }
    });
  }
});
