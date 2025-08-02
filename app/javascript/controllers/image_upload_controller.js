import { Controller } from "@hotwired/stimulus"
import { DirectUpload } from "@rails/activestorage"

// Connects to data-controller="image-upload"
export default class extends Controller {
  static targets = ["input", "preview"]
  
  fileAdded(event) {
    // Clear previous previews (don't clear on re-selection)
    if (this.previewTarget.children.length === 0) {
      this.previewTarget.innerHTML = ""
    }
    
    let files = Array.from(event.target.files)
    files.forEach(file => {
      // Check if this file is already being processed
      const existingPreview = this.previewTarget.querySelector(`[data-file-name="${file.name}"]`)
      if (existingPreview) {
        console.log("File already being processed:", file.name)
        return
      }
      
      // Show preview immediately
      this.showPreview(file)
      
      // Get the direct upload URL from the Rails form
      let directUploadUrl = event.target.dataset.directUploadUrl || "/rails/active_storage/direct_uploads"
      console.log("Direct upload URL:", directUploadUrl)
      
      // Start upload immediately
      setTimeout(() => {
        let previewDiv = this.previewTarget.querySelector(`[data-file-name="${file.name}"]`)
        let directUpload = new Uploader(file, directUploadUrl, this, previewDiv)
        previewDiv.uploader = directUpload // Store reference for cancellation
        directUpload.uploadFile(file)
      }, 100) // Small delay to ensure preview is rendered
    })
    
    // Clear the file input to allow re-selection of the same file
    setTimeout(() => {
      event.target.value = ""
    }, 200)
  }
  
  showPreview(file) {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const previewDiv = document.createElement("div")
        previewDiv.className = "relative"
        previewDiv.dataset.fileName = file.name // Add identifier for this preview
        previewDiv.id = `preview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // Unique ID
        
        const image = document.createElement("img")
        image.src = e.target.result
        image.className = "w-full h-32 object-cover rounded-lg shadow-md"
        
        // Close button
        const closeButton = document.createElement("button")
        closeButton.innerHTML = "&times;"
        closeButton.className = "absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 text-sm font-bold hover:bg-red-600 transition-colors cursor-pointer z-10"
        closeButton.style.cssText = "display: flex; align-items: center; justify-content: center; line-height: 1;"
        closeButton.type = "button"
        closeButton.addEventListener("click", () => {
          this.removePreview(previewDiv, file)
        })
        
        // Progress bar container
        const progressContainer = document.createElement("div")
        progressContainer.className = "w-full bg-gray-200 rounded-full h-2 mt-2"
        
        // Progress bar
        const progressBar = document.createElement("div")
        progressBar.className = "bg-blue-600 h-2 rounded-full transition-all duration-300"
        progressBar.style.width = "0%"
        progressContainer.appendChild(progressBar)
        
        // Status text
        const statusText = document.createElement("p")
        statusText.textContent = "Preparing upload..."
        statusText.className = "text-xs text-gray-600 mt-1"
        
        const fileName = document.createElement("p")
        fileName.textContent = file.name
        fileName.className = "text-xs text-gray-500 truncate"
        
        previewDiv.appendChild(image)
        previewDiv.appendChild(progressContainer)
        previewDiv.appendChild(statusText)
        previewDiv.appendChild(fileName)
        previewDiv.appendChild(closeButton)
        this.previewTarget.appendChild(previewDiv)
      }
      reader.readAsDataURL(file)
    }
  }
  
  removePreview(previewDiv, file) {
    // Cancel upload if it's in progress
    const uploader = previewDiv.uploader
    if (uploader) {
      console.log("Canceling upload for:", file.name)
      uploader.cancelUpload()
    }
    
    // Remove any hidden inputs for this file
    this.removeHiddenInputs(file.name)
    
    // Remove the preview from DOM
    previewDiv.remove()
    
    console.log("Removed preview for:", file.name)
  }
  
  removeHiddenInputs(fileName) {
    const form = this.element.closest('form')
    if (form) {
      // Remove hidden inputs that might have been created for this file
      const hiddenInputs = form.querySelectorAll('input[name="listing[images][]"]')
      hiddenInputs.forEach(input => {
        // We'll need to track which input belongs to which file
        if (input.dataset.fileName === fileName) {
          input.remove()
          console.log("Removed hidden input for:", fileName)
        }
      })
    }
  }
}

class Uploader {
  constructor(file, url, controller, previewDiv) {
    this.file = file
    this.url = url
    this.controller = controller
    this.previewDiv = previewDiv
    this.upload = new DirectUpload(this.file, this.url, this)
    this.cancelled = false
    this.xhr = null
  }

  uploadFile(file) {
    if (this.cancelled) return
    
    console.log("Starting upload for:", file.name)
    this.updateStatus("Starting upload...", 0)
    
    this.upload.create((error, blob) => {
      if (this.cancelled) {
        console.log("Upload was cancelled for:", file.name)
        return
      }
      
      if (error) {
        console.error("Upload error:", error)
        this.showError(error.message || "Upload failed")
      } else {
        console.log("File was uploaded successfully", blob)
        this.showSuccess()
        
        // Create hidden input with the blob ID so it gets submitted with form
        this.createHiddenInput(blob.signed_id)
      }
    })
  }
  
  cancelUpload() {
    this.cancelled = true
    if (this.xhr) {
      this.xhr.abort()
      console.log("Aborted XHR request for:", this.file.name)
    }
  }
  
  createHiddenInput(signedId) {
    const form = this.controller.element.closest('form')
    if (form) {
      const hiddenInput = document.createElement('input')
      hiddenInput.type = 'hidden'
      hiddenInput.name = 'listing[images][]'
      hiddenInput.value = signedId
      hiddenInput.dataset.fileName = this.file.name // Track which file this belongs to
      form.appendChild(hiddenInput)
      console.log("Added hidden input with signed_id:", signedId)
    }
  }
  
  showError(errorMessage) {
    if (this.previewDiv) {
      const progressBar = this.previewDiv.querySelector("div[class*='bg-']")
      const statusText = this.previewDiv.querySelector("p")
      
      // Update to error state
      if (progressBar) {
        progressBar.className = "bg-red-500 h-2 rounded-full transition-all duration-300"
        progressBar.style.width = "100%"
      }
      if (statusText) {
        statusText.textContent = `Upload failed: ${errorMessage}`
        statusText.className = "text-xs text-red-600 mt-1"
      }
    }
  }
  
  showSuccess() {
    if (this.previewDiv) {
      const progressBar = this.previewDiv.querySelector("div[class*='bg-']")
      const statusText = this.previewDiv.querySelector("p")
      
      // Update to success state
      if (progressBar) {
        progressBar.className = "bg-green-500 h-2 rounded-full transition-all duration-300"
        progressBar.style.width = "100%"
      }
      if (statusText) {
        statusText.textContent = "Upload complete! ✓"
        statusText.className = "text-xs text-green-600 mt-1"
      }
    }
  }
  
  updateStatus(message, percentage) {
    if (this.previewDiv) {
      const progressBar = this.previewDiv.querySelector("div[class*='bg-']")
      const statusText = this.previewDiv.querySelector("p")
      
      if (progressBar && statusText) {
        // Ensure we're only using blue for active uploads
        if (!progressBar.className.includes('bg-green') && !progressBar.className.includes('bg-red')) {
          progressBar.className = "bg-blue-600 h-2 rounded-full transition-all duration-300"
        }
        progressBar.style.width = `${percentage}%`
        statusText.textContent = `${message} ${percentage}%`
      }
    }
  }

  directUploadWillStoreFileWithXHR(request) {
    this.xhr = request // Store reference for cancellation
    request.upload.addEventListener("progress",
      event => this.directUploadDidProgress(event))
  }

  directUploadDidProgress(event) {
    const percentage = Math.round((event.loaded / event.total) * 100)
    this.updateStatus("Uploading...", percentage)
  }
}
