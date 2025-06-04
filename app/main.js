/* final countdown
    * ------------------------------------------------------ */
const ssFinalCountdown = function() {

    const getyear = new Date().getFullYear();
    const finalDate = '/12/31';

    $('.counter').countdown(`${getyear}`+finalDate)
    .on('update.countdown finish.countdown', function(event) {

        const str = '<div class=\"counter__time days\">%D&nbsp;<span>D</span></div>' +
                    '<div class=\"counter__time hours\">%H&nbsp;<span>H</span></div>' +
                    '<div class=\"counter__time minutes\">%M&nbsp;<span>M</span></div>' +
                    '<div class=\"counter__time seconds\">%S&nbsp;<span>S</span></div>';
                
        $(this).html(event.strftime(str));

    });
};
