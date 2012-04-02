/*
* Blog Slide Show
*
* @package blogslideshow
* @author Dmitry Sheiko
* @version $Revision$
* @license GNU
* @copyright (c) Dmitry Sheiko http://dsheiko.com
* @projectDescription A fancy image viewer, that supports many different types of transition
*                     effects including CSS3/HTML5-related.
* @param {effect : string, css: string } - effect can be one of following fade, scroll, ladder,
*                                          jalousie, rotate, zoom, null
*                                          css [OPTIONAL] - stylesheet filename
* @return void
*
* Dependencies:
*   tEffect (t-effect.js)
*   aQueue (a-queue.js)
* 
* Project page: http://blogslideshow.googlecode.com/
* Usage examples:
* window.onload = function(){
*     new bsShow({
*         effect: 'fade'
*     });
* }
* 
* Compatibility:
*	Tested with Google Chrome 4.1, Firefox 3.6.3, Opera 10.10, Apple Safari 4.0.5, IE 8
*	Requires jQuery 1.4+
*
*/

/**
 * Blog Slide Show Component
 * @param object options - available options:
 *  effect : string
 *  css : string
 */
function bsShow(options)
{
    // Reconfigurable Singleton
    if (null !== bsShow.instace) {
        bsShow.instace.merge(options);
        return;
    }
    this.merge(options);
    this.init();
    bsShow.instace = this;
}

(function(bsShow) {

var MIN_WIDTH  = 300,
    MIN_HEIGHT = 300;
    
// JS Helpers
// Shortcut for getElementById
var $ = function(divName) {
    return document.getElementById(divName);
};
// Detects whether it's IE-browser or not
$.ie = function() {
    if (navigator.userAgent.toLowerCase().indexOf("msie") != -1) {
        return true;
    }
    return false;
}

// Helper to pass context of use
$.proxy = function (method, context) {
    if (typeof method == 'string') method = context[method];
    var cb = function () {method.apply(context, arguments);}
    return cb;
 };

// Unbind event
$.unbind = function(node, eType, func) {
    if (document.removeEventListener) {
        node.removeEventListener(eType, func, false);
    } else if (document.detachEvent) {
        node.detachEvent('on' + eType, func);
    }
    return node;
};
// Bind event
$.bind = function(node, eType, func) {
    if (document.addEventListener) {
        node.addEventListener(eType, func, false);
    } else if (document.attachEvent) {
        node.attachEvent('on' + eType, func);
    }
    return node;
};
// Combined function to reset event handler
$.delegate = function(node, eType, cb, context) {
    var func = $.proxy(cb, context);
    $.unbind(node, eType, func);
    $.bind(node, eType, func);
};
// Load given CSS file
$.cssLoad = function(file) {
    var node = document.createElement("link")
    node.href = file;
    node.rel = "stylesheet";
    node.type = "text/css";
    document.body.appendChild(node);
};
// Append given HTML in the document
$.insert = function(tagName, html, options) {
    var node = document.createElement(tagName);
    if (html.length) {
        node.innerHTML = html;
    }
    if (undefined !== options) {
        for (key in options) {
            node[key] = options[key];
        }

    }
    document.body.appendChild(node);
};
// Get window size
$.viewport = function() {
	var w = 0;
	var h = 0;
	//IE
	if(!window.innerWidth)
	{
            //strict mode
            if(!(document.documentElement.clientWidth == 0)) {
                w = document.documentElement.clientWidth;
                h = document.documentElement.clientHeight;
            }
            //quirks mode
            else {
                if(document.body.clientWidth) {
                    w = document.body.clientWidth;
                    h = document.body.clientHeight;
                } else {
                    w = window.document.body.offsetWidth;
                    h = window.document.body.offsetHeight;
                }
            }
	}
	//w3c
	else {
            w = window.innerWidth;
            h = window.innerHeight;
	}
	return {width:w,height:h};
};




bsShow.instace = null;

bsShow.prototype = {
        options : {
            'css' : 'blogslideshow.css',
            'effect' : 'fade'
        },
	images : [],
	active : null,
        backup : {},

        // Placeholders
        boundingBox : null, // Overlay
        toolbarNode : null, // Toolbar area with navigation buttons
        freezeScreenNode : null, // Mask frezzeing the screen
        prevBtnNode : null, // To previous image button
        nextBtnNode : null, // To next image button
        closeBtnNode : null, // Close overlay button
        imageNode : null, // Image object
        overlayImageNode: null, // Overlay image which is used for transitional effects
        overlayMaskNode: null, // Overlay div with grid which is used for transitional effects

	init : function() {
            $.cssLoad(this.options.css);
            this.checkDependencies();
            this.delegateFramework();
            $.bind(document, 'keydown', $.proxy(this._onKeypress, this));            
            this._walkThroughA();
	},
        /**
         * Object property getter (for compliance with YUI3)
         * @param (string) property
         * @return (mixed)
         */
        get : function(property) {
            return this[property];
        },
        /**
         * Object property setter (for compliance with YUI3)
         * @param (string) property
         * @param (mixed) value
         */
        set : function(property, value) {
            this[property] = value;
        },
        /**
         * Checks if whether dependencies are loaded
         */
        checkDependencies : function() {
            if (undefined == tEffect) {
                throw "Cannot find dependency - Transiton Effect library";
            }
            if (undefined == aQueue) {
                throw "Cannot find dependency - Asynchronous Queue library";
            }
        },
        /**
         * Delegate DOM manipulation function of the framework to Transition Effect library
         */
        delegateFramework : function() {
            tEffect.Util().delegate({
                isIe: $.ie,
                setStyle : function(node, property, value) {
                    node.style[property] = value;
                },
                getStyle : function(node, property) {
                    return node.style[property].replace(/px$/, "");
                },
                transform : function(node, value) {
                   node.style.webkitTransform = value;
                   node.style.MozTransform = value;
                },
                windowWidth : function() {
                    return $.viewport().width;
                },
                windowHeight : function() {
                    return $.viewport().height;
                },
                show : function(node) {
                    node.className = '';
                },
                hide : function(node) {
                    node.className = 'hidden';
                },
                set : function(node, property, value) {
                    node[property] = value;
                },
                get : function(node, property) {
                    return node[property];
                },
                eachChild : function(node, callback, scope) {
                    for (var i in node.children) {
                        if ('object' == typeof(node.children[i])) {
                            callback(i, node.children[i], scope)
                        }
                    }
                }
             });
        },
        merge : function(options) {
            if (undefined !== options) {
                for (var key in options) {
                    this.options[key] = options[key];
                }
            }
        },
        /**
         * Aligns component to center of the screen
         * @return void
         */
        center : function() {            
            if (this.imageNode.width < MIN_WIDTH) {
                this.imageNode.width = MIN_WIDTH;
            }
            if (this.imageNode.height < MIN_HEIGHT) {
                this.imageNode.height = MIN_HEIGHT;
            }
            tEffect.Util(this.boundingBox).centerBy(this.imageNode);
        },
        /**
         * Retrieves previous and next links
         * @return void
         */
        getNavigation : function() {
          // Get navigation position
            var i = 0; // actual index
            // Get actual pagination
            for (var j in this.images) {
                if (this.images[j].src == this.active
                    || this.images[j].rel == this.active) {
                    i = j;
                }
            }
            var prevLink = (i > 0 ? this.images[i - 1].src : null);
            var nextLink = (i < (this.images.length - 1) ? this.images[i * 1 + 1].src
                : null);
            return {prev:prevLink, next: nextLink};
        },
        /**
         * Updates slide show component
         * @param string href
         * @return void
         */
        showImage : function(href) {
            if (null === href || !href.length) {
                return;
            }
            this.backup  = {
                left: this.imageNode.style.left.replace(/\,px$/, ""),
                top: this.imageNode.style.top.replace(/\,px$/, "")
            };
            this.active = href;
            if (this.options.effect && this.imageNode.src != href)  {
                switch (this.options.effect) {
                    case 'fade' :
                        aQueue.add({
                            startedCallback: tEffect._fadeStarted,
                            iteratedCallback: tEffect._fadeIterated,
                            completedCallback: tEffect._fadeCompleted,
                            iterations: 3,
                            delay: 100,
                            scope: this}).run();
                        break;
                    case 'jalousie' :
                        aQueue.add({
                            startedCallback: tEffect._jalousieStarted,
                            iteratedCallback: tEffect._jalousieIterated,
                            completedCallback: tEffect._jalousieCompleted,
                            iterations: 5,
                            delay: 50,
                            scope: this}).run();
                        break;
                    case 'ladder' :
                        aQueue.add({
                            startedCallback: tEffect._ladderStarted,
                            iteratedCallback: tEffect._ladderIterated,
                            completedCallback: tEffect._ladderCompleted,
                            iterations: 20,
                            delay: 50,
                            reverse: true,
                            scope: this}).run();
                        break;
                    case 'scroll' :
                        aQueue.add({
                            startedCallback: tEffect._scrollStarted,
                            iteratedCallback: tEffect._scrollIterated,
                            completedCallback: tEffect._scrollCompleted,
                            iterations: 5,
                            delay: 150,
                            reverse: true,
                            scope: this}).run();
                        break;
                     case 'rotate' :
                        aQueue.add({
                            startedCallback: tEffect._rotateStarted,
                            iteratedCallback: tEffect._rotateIterated,
                            completedCallback: tEffect._rotateCompleted,
                            iterations: 10,
                            delay: 50,
                            scope: this}).run();
                        break;                    
                    case 'zoom' :
                        aQueue.add({
                            startedCallback: tEffect._zoomStarted,
                            iteratedCallback: tEffect._zoomIterated,
                            completedCallback: tEffect._zoomHalfCompleted,
                            iterations: 5,
                            delay: 50,
                            scope: this,
                            reverse : true}).add({
                            iteratedCallback: tEffect._zoomIterated,
                            completedCallback: tEffect._zoomCompleted,
                            iterations: 5,
                            delay: 50,
                            scope: this}).run();
                        break;
                }
            } else {
                this.imageNode.src = href;
            }

           

        },
        /**
         * Event handlers
         * Each handler:
         * @param event e
         * @return void
         */
        _onKeypress : function(e) {
            // Escape
            if (27 == e.keyCode) {
                this._onClickClose(e);
            }
            // Next
            if (39 == e.keyCode) {
                 this._onClickNext(e);
            }
            // Previous
            if (37 == e.keyCode) {
               this._onClickPrev(e);
            }
        },
        _onClickPrev : function(e) {
            if($.ie()) {var e = window.event;} else {e.preventDefault();}
            e.returnValue = false; // IE fix
            this.timer = null;
            this.showImage(this.getNavigation().prev);
        },
        _onClickNext : function(e) {
            if($.ie()) {var e = window.event;} else {e.preventDefault();}
            e.returnValue = false; // IE fix
            this.timer = null;
            this.showImage(this.getNavigation().next);
        },
        _onClickClose : function(e) {
            if($.ie()) {var e = window.event;} else {e.preventDefault();}
            e.returnValue = false; // IE fix
            this.timer = null;
            try {
                document.body.removeChild(this.freezeScreenNode);
                document.body.removeChild(this.boundingBox);
                document.body.removeChild(this.overlayImageNode);
                document.body.removeChild(this.overlayMaskNode);
            } catch(e) {  }
        },
        _onMouseOverBoundingBox : function(e) {
            this.toolbarNode.className = '';
        },
        _onMouseOutBoundingBox : function(e) {
            this.toolbarNode.className = 'hidden';
        },
        /**
         * Subscribe event handlers for the slide show component
         * @return void
         */
        bindUI : function() {
            $.delegate(this.freezeScreenNode, 'click', this._onClickClose, this);
            $.delegate(this.prevBtnNode, 'click', this._onClickPrev, this);
            $.delegate(this.nextBtnNode, 'click', this._onClickNext, this);
            $.delegate(this.closeBtnNode, 'click', this._onClickClose, this);
            
            this.overlayImageNode.onmouseover = $.proxy(this._onMouseOverBoundingBox, this);
            this.boundingBox.onmouseover = $.proxy(this._onMouseOverBoundingBox, this);
            this.overlayImageNode.onmouseout = $.proxy(this._onMouseOutBoundingBox, this);
            this.boundingBox.onmouseout = $.proxy(this._onMouseOutBoundingBox, this);
            if (!this.options.effect) {
                $.bind(this.imageNode, 'load', $.proxy(this.center, this));
            }
            window.onresize = $.proxy(this.center, this);
        },
        /**
         * Renders HTML for the slide show component
         * @param string href
         * @return void
         */
	renderUI : function(href) {
            if (null === href || !href.length) {
                return;
            }
            var tpl = '<img id="ss-image" src="' + href + '" />' +
                '<div id="ss-toolbar" class="hidden">' +
                '   <div id="ss-prev" class="ss-btn"><!-- --></div>' +
                '   <div id="ss-close" class="ss-btn"><!-- --></div>' +
                '   <div id="ss-next" class="ss-btn"><!-- --></div>' +
                '</div>';

            $.insert('div', '', {id:'ss-mask'});
            $.insert('div', tpl, {id:'ss-window'});
            $.insert('img', '', {id:'ss-sprite', className: 'hidden'});
            $.insert('div', '', {id:'ss-effect-overlay', className: 'hidden'});

            this.freezeScreenNode = $('ss-mask'); 
            this.boundingBox = $('ss-window');
            this.toolbarNode = $('ss-toolbar');
            this.prevBtnNode = $('ss-prev');
            this.nextBtnNode = $('ss-next');
            this.closeBtnNode = $('ss-close');
            this.imageNode = $('ss-image'); 
            this.overlayImageNode = $('ss-sprite'); 
            this.overlayMaskNode = $('ss-effect-overlay'); 

            this._fillEOverlay();
            
            this.bindUI();
            this.center();
            this.showImage(href);
	},
        _fillEOverlay : function() {
            for (var i = 0; i < 10; i++) {
                this.overlayMaskNode.appendChild(document.createElement('div'));
            }
        },      
        /**
         * Walks through A elements, looking for those which contains Rel=blogslideshow
         * Collect urls of images to be shown
         */
	_walkThroughA : function() {
            var i = 0;
            var links = document.getElementsByTagName("A");
            for(var j in links) {
                 var relAttr  = links[j].rel + ""; // as a String
                 var re = new RegExp("blogslideshow","gi");
                 if (relAttr && re.test(relAttr) && links[j].href) {
                    // Assigns onclick event for found links
                    links[j].onclick = $.proxy(function(e) {
                        if($.ie()) {var e = window.event;} else {e.preventDefault();}
                        e.returnValue = false; // IE fix
                        this.renderUI($.ie() ? e.srcElement.href : e.currentTarget.href);
                    }, this);
                    // Storages required info
                    this.images[i] = new Image();
                    this.images[i].src = links[j].href;
                    this.images[i].rel = links[j].href;
                    i++;
                 }
            }
	}
};

})(bsShow);