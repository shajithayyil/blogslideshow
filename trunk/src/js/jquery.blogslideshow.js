/*
 * BlogSlideShow
 *
 * Usage example:
 *  
 * @package BlogSlideShow
 * @author Dmitry Sheiko (http://dsheiko.com)
 * @version jquery.blogslideshow.js, v 3.0a
 * @license GNU
 * @copyright (c) Dmitry Sheiko http://www.dsheiko.com
 */
(function( $ ) {
    
    var bsShow = function(settings) {
        var MASK_TPL= '<div class="bss-mask"></div>',
            IMAGECACHE_TPL= '<div class="bss-image-cache"></div>',
            OVERLAY_TPL = 
        '<div class="bss-overlay">' +
            '<div class="bss-anchor">' + 
                '<div class="bss-boundingBox"></div>' +                
                '<div class="bss-left prev"></div>' +
                '<div class="bss-right next"></div>' +  
                '<div class="bss-caption"></div>' +  
            '</div>' +
            '<div class="bss-toolbar">' +
                '<button class="close"></button>' +
                '<button class="prev"></button>' +
                '<button class="next"></button>' +   
            '</div>' +
        '</div>',
            ITEM_BTN_TPL = '<button class="item"></button>',
        _images = [],
        _settings = settings,
        _manager = null,
        _node = {
            mask: null,
            overlay: null,
            boundingBox: null,
            caption: null,
            next: null,
            prev: null,
            close: null,
            items: []
        };
        return {            
            init: function(links) {                
                if (!links.length) {
                    throw "Images not specified";
                }                
                this.prefetchImages(links);
                this.syncUI(links);
            },
            set: function(settings) {
                _settings = settings;
            },
            prefetchImages: function(links) {
                var img, rep = $(IMAGECACHE_TPL).appendTo('body');
                links.each(function(i, el){
                    img = new Image();
                    img.src = el.href + "?v=" + (new Date()).getTime();
                    img.title = el.title;
                    $(this).data("index", i);
                    $(img).appendTo(rep);
                }); 
                _images = rep.find('img');
            },
            syncUI : function(links) {                
                links.unbind('click.bss').bind('click.bss', this, function(e){
                    e.preventDefault();
                    e.data.showUI($(this).data("index"));
                });
            },            
            adjustByImage: function(index) {
                var image = $(_images[index]);
                if (image.attr('title').length) {
                    _node.caption.html(image.attr('title')).show();
                } else {
                    _node.caption.hide();
                }
                _node.overlay.css({
                    'width':image.width(),
                    'height': image.height() + 36
                });                
                _node.overlay.css({
                    'top': ($(window).height() - image.height()) / 2,
                    'left': ($(window).width() - image.width()) / 2,
                    'visibility': "visible"
                });
            },
            initEffectLibrary: function(index) {
                _manager = $.tEffects({
                    boundingBox: _node.boundingBox,
                    images: _images,
                    effect: _settings.effect, 
                    method: _settings.method, 
                    direction: _settings.direction,
                    transitionDuration: _settings.transitionDuration, // sec
                    transitionDelay: _settings.transitionDelay, // ms
                    initalIndex: index,
                    triggerNext: {
                        node: _node.next,
                        event: 'click'
                    },
                    triggerPrev: {
                        node: _node.prev,
                        event: 'click'
                    },
                    controls: {
                        template: ITEM_BTN_TPL,
                        appendTo: _node.overlay.find('div.bss-toolbar')
                    }
                });
                _manager.enable();
                $(document).bind('start-transition.t-effect', this, function(e, index){
                    e.data.adjustByImage(index);
                }); 
            },
            showUI:  function(index) {
                _node.mask = $(MASK_TPL).appendTo("body");
                _node.overlay = $(OVERLAY_TPL).appendTo("body");
                _node.boundingBox = _node.overlay.find('div.bss-boundingBox');                                
                _node.next = _node.overlay.find('.next');
                _node.prev = _node.overlay.find('.prev');
                _node.close = _node.overlay.find('button.close');
                _node.caption = _node.overlay.find('div.bss-caption');
                
                this.initEffectLibrary(index);
                
                this.adjustByImage(index);
                
                _node.mask.css('visibility', "visible");
                _node.overlay.css('visibility', "visible");
                
                _node.close.bind('click.bss', this, this.hideUI);
                _node.mask.bind('click.bss', this, this.hideUI);
                $(document).bind('keydown', this, function(e){
                    if (e.which === 27) {
                        e.data.hideUI();
                    }
                });
            },
            hideUI: function() {
                _manager.disable();
                delete _manager;
                if(_node.overlay.length) {
                    _node.overlay.remove();
                }
                if(_node.mask.length) {
                    _node.mask.remove();
                }
            }
        }
    };
    
    $.fn.bsShow = function(settings) {
        var instace = new bsShow(settings);
        instace.init($(this));
        return instace;
    }
    
    
})( jQuery );
