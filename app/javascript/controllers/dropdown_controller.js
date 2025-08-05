import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="dropdown"
export default class extends Controller {
  static targets = ["menu"]

  toggle(e) {
    e.preventDefault();
    this.menuTarget.classList.toggle("hidden");
    this.menuTarget.classList.toggle("opacity-0");
    setTimeout(() => {
      this.menuTarget.classList.toggle("opacity-100");
    }, 100);
  }

  closeUnlessDropdown(e) {
    if (!this.element.contains(e.target) && !this.menuTarget.classList.contains("hidden")) {
      this.menuTarget.classList.add("hidden");
    }
  }
}
