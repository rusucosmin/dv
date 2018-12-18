$(function() {
  var imgSrcPostfix = '_sigs.svg';

  $('.measurement input').change(function() {
    var $elem = $(this);
    var value = $elem.attr('value');
    console.log(value);
    $('#vizspace img').attr('src', 'images/' + value + imgSrcPostfix);
  });
});
