import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="utils"
export default class extends Controller {
  remove() {
    this.element.remove()
  }
}
