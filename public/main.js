function toggleFullScreen(e) {
    if (!document.fullscreenElement) {
        e.currentTarget.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function fitCurrentDisplay(e) {
    const target = e.currentTarget.closest('.canvas-wrapper').querySelector('canvas')
    if ($(target).hasClass('fill-canvas'))
        target.classList.remove('fill-canvas')
    else
        target.classList.add('fill-canvas')
}


$(document).on("dblclick", '.canvas-wrapper', toggleFullScreen);
$(document).on("click", '.fill-display', fitCurrentDisplay);