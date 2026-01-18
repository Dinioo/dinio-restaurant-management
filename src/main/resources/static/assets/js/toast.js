function showToast(message, type = 'info', duration = 3000) {
  Toastify({
    text: message,
    duration: duration,
    gravity: "top",       // top | bottom
    position: "right",    // left | center | right
    close: true,
    className: type,
    stopOnFocus: true,
  }).showToast();
}

// Shortcut functions
function successToast(msg) { showToast(msg, 'success'); }
function errorToast(msg)   { showToast(msg, 'error', 1000); }
function warningToast(msg) { showToast(msg, 'warning', 1000); }
function infoToast(msg)    { showToast(msg, 'info'); }
