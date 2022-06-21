(function ($) {
    "use strict";

    // offcanvas-js
    $('.offcanvas-open').click(function () {
        $('.offcanvas-menu').addClass('active');
        $('.offcanvas-overlay').addClass('active');
    });

    $('.offcanvas-menu a').click(function () {
        $('.offcanvas-menu').removeClass('active');
        $('.offcanvas-overlay').removeClass('active');
    });

    $('.close-offcanvas').click(function () {
        $('.offcanvas-menu').removeClass('active');
        $('.offcanvas-overlay').removeClass('active');
    });

    $(document).mouseup(function (e) {
        var container = $(".offmenu");

        // If the target of the click isn't the container
        if (!container.is(e.target) && container.has(e.target).length === 0) {
            $('.offcanvas-menu').removeClass('active');
            $('.offcanvas-overlay').removeClass('active');
        }
    });
})(jQuery);


$(document).ready(function () {
    //countdown
    $('.number-countdown').each(function () {
        var $this = $(this), finalDate = $(this).data('countdown');
        $this.countdown(finalDate, function (event) {
            $this.html(event.strftime('<span class="time-count">%D</span>:<span class="time-count">%H</span>:<span class="time-count">%M</span>:<span class="time-count">%S</span>'));
        });
    });

    $('.text-countdown').each(function () {
        var $this = $(this), finalDate = $(this).data('countdown');
        $this.countdown(finalDate, function (event) {
            $this.html(event.strftime('<span class="time-count">%D <span class="title">days</span> </span><span class="time-count">%H <span class="title">hou<span class="color-text">rs</span> </span></span><span class="time-count color-text">%M <span class="title">minutes</span></span><span class="time-count">'));
        });
    });

    // scroll up
    $(function () {
        $.scrollUp();
    });

    $("#preloader").fadeOut(500);
})











