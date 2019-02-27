
//提示小弹窗
function runSmallLayer(){
    var html = '';
    html += '<div class="commom-popup-outside  small-popup-outside"  >'+
                '<div class="commom-popup">'+
                    '<div class="title title-nobg"><i class="icon-error"></i></div>'+
                    '<div class="content">'+
                        '<div class="up">您还没有可用服务码，<br>是否现在激活服务码？</div>'+
                        '<div class="commom-submit need-submit">'+
                            '<a class="btn-block btn-primary small-popup-btn" href="javascript:;" >好&nbsp;&nbsp;的</a>'+
                        '</div>'+
                    '</div>'+
                '</div>'+
            '</div>';
    $('body').prepend(html);
}

