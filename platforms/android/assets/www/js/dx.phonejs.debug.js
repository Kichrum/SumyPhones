/* 
* DevExpress PhoneJS
* Version: 13.1.4
* Build date: Jun 6, 2013
*
* Copyright (c) 2012 - 2013 Developer Express Inc. ALL RIGHTS RESERVED
* EULA: http://phonejs.devexpress.com/EULA
*/

"use strict";

// Module core, file devexpress.js

(function($, global, undefined) {
    if (parseFloat($.fn.jquery) < 1.8)
        throw Error("Your version of jQuery is too old. Please upgrade jQuery to 1.8.0 or later.");
    var Class = function() {
            var wrapOverridden = function(baseProto, methodName, method) {
                    return function() {
                            var prevCallBase = this.callBase;
                            this.callBase = baseProto[methodName];
                            try {
                                return method.apply(this, arguments)
                            }
                            finally {
                                this.callBase = prevCallBase
                            }
                        }
                };
            var clonePrototype = function(obj) {
                    var func = function(){};
                    func.prototype = obj.prototype;
                    return new func
                };
            var classImpl = function(){};
            var redefine = function(members) {
                    var self = this;
                    if (!members)
                        return self;
                    var memberNames = $.map(members, function(_, k) {
                            return k
                        });
                    $.each(["toString", "toLocaleString", "valueOf"], function() {
                        if (members[this])
                            memberNames.push(this)
                    });
                    $.each(memberNames, function() {
                        var overridden = $.isFunction(self.prototype[this]) && $.isFunction(members[this]);
                        self.prototype[this] = overridden ? wrapOverridden(self.parent.prototype, this, members[this]) : members[this]
                    });
                    return self
                };
            var include = function() {
                    var classObj = this;
                    $.each(arguments, function() {
                        if (this.ctor)
                            classObj._includedCtors.push(this.ctor);
                        for (var name in this) {
                            if (name === "ctor")
                                continue;
                            if (name in classObj.prototype)
                                throw Error("Member name collision: " + name);
                            classObj.prototype[name] = this[name]
                        }
                    });
                    return classObj
                };
            var subclassOf = function(parentClass) {
                    if (this.parent === parentClass)
                        return true;
                    if (!this.parent || !this.parent.subclassOf)
                        return false;
                    return this.parent.subclassOf(parentClass)
                };
            classImpl.inherit = function(members) {
                var inheritor = function() {
                        if (!this || this.constructor !== inheritor)
                            throw Error("A class must be instantiated using the 'new' keyword");
                        var instance = this,
                            ctor = instance.ctor;
                        if (ctor)
                            ctor.apply(instance, arguments);
                        $.each(instance.constructor._includedCtors, function() {
                            this.call(instance)
                        })
                    };
                inheritor.prototype = clonePrototype(this);
                inheritor.inherit = this.inherit;
                inheritor.redefine = redefine;
                inheritor.include = include;
                inheritor.subclassOf = subclassOf;
                inheritor.parent = this;
                inheritor._includedCtors = this._includedCtors ? this._includedCtors.slice(0) : [];
                inheritor.prototype.constructor = inheritor;
                inheritor.redefine(members);
                return inheritor
            };
            return classImpl
        }();
    var enqueue = function() {
            var tasks = [],
                busy = false;
            var exec = function() {
                    while (tasks.length) {
                        var task = tasks.shift(),
                            result = task();
                        if (result === undefined)
                            continue;
                        if (result.then) {
                            busy = true;
                            $.when(result).always(exec);
                            return
                        }
                        throw Error();
                    }
                    busy = false
                };
            return function(task) {
                    tasks.push(task);
                    if (!busy)
                        exec()
                }
        }();
    var parseUrl = function() {
            var a = document.createElement("a"),
                props = ["protocol", "hostname", "port", "pathname", "search", "hash"];
            var normalizePath = function(value) {
                    if (value.charAt(0) !== "/")
                        value = "/" + value;
                    return value
                };
            return function(url) {
                    a.href = url;
                    var result = {};
                    $.each(props, function() {
                        result[this] = a[this]
                    });
                    result.pathname = normalizePath(result.pathname);
                    return result
                }
        }();
    global.DevExpress = global.DevExpress || {};
    var enqueueAsync = function(task) {
            var deferred = $.Deferred();
            setTimeout(function() {
                deferred.resolve(task())
            }, 60);
            return deferred
        };
    var backButtonCallback = function() {
            var callbacks = [];
            return {
                    add: function(callback) {
                        callbacks.push(callback)
                    },
                    remove: function(callback) {
                        var indexOfCallback = $.inArray(callback, callbacks);
                        if (indexOfCallback !== -1)
                            callbacks.splice(indexOfCallback, 1)
                    },
                    fire: function() {
                        var callback = callbacks.pop(),
                            result = !!callback;
                        if (result)
                            callback();
                        return result
                    }
                }
        }();
    var overlayTargetContainer = function() {
            var defaultTargetContainer = null;
            return function(targetContainer) {
                    if (arguments.length)
                        defaultTargetContainer = targetContainer;
                    return defaultTargetContainer
                }
        }();
    $.extend(global.DevExpress, {
        abstract: function() {
            throw Error("Not implemented");
        },
        Class: Class,
        enqueue: enqueue,
        enqueueAsync: enqueueAsync,
        parseUrl: parseUrl,
        backButtonCallback: backButtonCallback,
        overlayTargetContainer: overlayTargetContainer
    })
})(jQuery, this);

// Module core, file inflector.js

(function($, DX, undefined) {
    var _normalize = function(text) {
            if (text === undefined || text === null)
                return "";
            return String(text)
        };
    var _ucfirst = function(text) {
            return _normalize(text).charAt(0).toUpperCase() + text.substr(1)
        };
    var _chop = function(text) {
            return _normalize(text).replace(/([a-z\d])([A-Z])/g, "$1 $2").split(/[\s_-]+/)
        };
    var dasherize = function(text) {
            return $.map(_chop(text), function(p) {
                    return p.toLowerCase()
                }).join("-")
        };
    var underscore = function(text) {
            return dasherize(text).replace(/-/g, "_")
        };
    var camelize = function(text, upperFirst) {
            return $.map(_chop(text), function(p, i) {
                    p = p.toLowerCase();
                    if (upperFirst || i > 0)
                        p = _ucfirst(p);
                    return p
                }).join("")
        };
    var humanize = function(text) {
            return _ucfirst(dasherize(text).replace(/-/g, " "))
        };
    var titleize = function(text) {
            return $.map(_chop(text), function(p) {
                    return _ucfirst(p.toLowerCase())
                }).join(" ")
        };
    DX.inflector = {
        dasherize: dasherize,
        camelize: camelize,
        humanize: humanize,
        titleize: titleize,
        underscore: underscore
    }
})(jQuery, DevExpress);

// Module core, file support.js

(function($, DX, window) {
    var cssPrefixes = ["", "Webkit", "Moz", "O", "ms"],
        styles = document.createElement("dx").style;
    var transitionEndEventNames = {
            WebkitTransition: 'webkitTransitionEnd',
            MozTransition: 'transitionend',
            OTransition: 'oTransitionEnd',
            msTransition: 'MsTransitionEnd',
            transition: 'transitionend'
        };
    var styleProp = function(prop) {
            prop = DX.inflector.camelize(prop, true);
            for (var i = 0, cssPrefixesCount = cssPrefixes.length; i < cssPrefixesCount; i++) {
                var specific = cssPrefixes[i] + prop;
                if (specific in styles)
                    return specific
            }
        };
    var supportProp = function(prop) {
            return !!styleProp(prop)
        };
    DX.support = {
        touch: "ontouchstart" in window,
        transform3d: supportProp("perspective"),
        transition: supportProp("transition"),
        transitionEndEventName: transitionEndEventNames[styleProp("transition")],
        animation: supportProp("animation"),
        winJS: "WinJS" in window,
        styleProp: styleProp,
        supportProp: supportProp
    }
})(jQuery, DevExpress, this);

// Module core, file browser.js

(function($, DX, global, undefined) {
    var webkitRegExp = /(webkit)[ \/]([\w.]+)/,
        operaRegExp = /(opera)(?:.*version)?[ \/]([\w.]+)/,
        ieRegExp = /(msie) ([\w.]+)/,
        mozillaRegExp = /(mozilla)(?:.*? rv:([\w.]+))?/;
    var ua = navigator.userAgent.toLowerCase();
    var browser = function() {
            var result = {},
                matches = webkitRegExp.exec(ua) || operaRegExp.exec(ua) || ieRegExp.exec(ua) || ua.indexOf("compatible") < 0 && mozillaRegExp.exec(ua) || [],
                browserName = matches[1],
                browserVersion = matches[2];
            if (browserName) {
                result[browserName] = true;
                result.version = browserVersion
            }
            return result
        }();
    DX.browser = browser
})(jQuery, DevExpress, this);

// Module core, file position.js

(function($, DX, undefined) {
    var horzRe = /left|right/,
        vertRe = /top|bottom/,
        collisionRe = /fit|flip/;
    var splitPair = function(raw) {
            switch (typeof raw) {
                case"string":
                    return raw.split(/\s+/, 2);
                case"object":
                    return [raw.x || raw.h, raw.y || raw.v];
                case"number":
                    return [raw];
                default:
                    return raw
            }
        };
    var normalizeAlign = function(raw) {
            var result = {
                    h: "center",
                    v: "center"
                };
            var pair = splitPair(raw);
            if (pair)
                $.each(pair, function() {
                    var w = String(this).toLowerCase();
                    if (horzRe.test(w))
                        result.h = w;
                    else if (vertRe.test(w))
                        result.v = w
                });
            return result
        };
    var normalizeOffset = function(raw) {
            var pair = splitPair(raw),
                h = parseInt(pair && pair[0], 10),
                v = parseInt(pair && pair[1], 10);
            if (!isFinite(h))
                h = 0;
            if (!isFinite(v))
                v = h;
            return {
                    h: h,
                    v: v
                }
        };
    var normalizeCollision = function(raw) {
            var pair = splitPair(raw),
                h = String(pair && pair[0]).toLowerCase(),
                v = String(pair && pair[1]).toLowerCase();
            if (!collisionRe.test(h))
                h = "none";
            if (!collisionRe.test(v))
                v = h;
            return {
                    h: h,
                    v: v
                }
        };
    var getAlignFactor = function(align) {
            switch (align) {
                case"center":
                    return 0.5;
                case"right":
                case"bottom":
                    return 1;
                default:
                    return 0
            }
        };
    var inverseAlign = function(align) {
            switch (align) {
                case"left":
                    return "right";
                case"right":
                    return "left";
                case"top":
                    return "bottom";
                case"bottom":
                    return "top";
                default:
                    return align
            }
        };
    var initMyLocation = function(data) {
            data.myLocation = data.atLocation + getAlignFactor(data.atAlign) * data.atSize - getAlignFactor(data.myAlign) * data.mySize + data.offset
        };
    var decolliders = {
            fit: function(data, bounds) {
                if (data.myLocation > bounds.max)
                    data.myLocation = bounds.max;
                if (data.myLocation < bounds.min)
                    data.myLocation = bounds.min
            },
            flip: function(data, bounds) {
                if (data.myAlign === "center" && data.atAlign === "center")
                    return;
                if (data.myLocation < bounds.min || data.myLocation > bounds.max) {
                    var inverseData = $.extend({}, data, {
                            myAlign: inverseAlign(data.myAlign),
                            atAlign: inverseAlign(data.atAlign),
                            offset: -data.offset
                        });
                    initMyLocation(inverseData);
                    if (inverseData.myLocation >= bounds.min && inverseData.myLocation <= bounds.max || inverseData.myLocation > data.myLocation)
                        data.myLocation = inverseData.myLocation
                }
            }
        };
    var scrollbarWidth;
    var position = function(what, options) {
            var $what = $(what);
            if (!options)
                return $what.offset();
            var my = normalizeAlign(options.my),
                at = normalizeAlign(options.at),
                of = options.of || window,
                offset = normalizeOffset(options.offset),
                collision = normalizeCollision(options.collision);
            var h = {
                    mySize: $what.outerWidth(),
                    myAlign: my.h,
                    atAlign: at.h,
                    offset: offset.h,
                    collision: collision.h
                };
            var v = {
                    mySize: $what.outerHeight(),
                    myAlign: my.v,
                    atAlign: at.v,
                    offset: offset.v,
                    collision: collision.v
                };
            if (of.preventDefault) {
                h.atLocation = of.pageX;
                v.atLocation = of.pageY;
                h.atSize = 0;
                v.atSize = 0
            }
            else {
                of = $(of);
                if ($.isWindow(of[0])) {
                    h.atLocation = of.scrollLeft();
                    v.atLocation = of.scrollTop();
                    h.atSize = of.width();
                    v.atSize = of.height()
                }
                else if (of[0].nodeType === 9) {
                    h.atLocation = 0;
                    v.atLocation = 0;
                    h.atSize = of.width();
                    v.atSize = of.height()
                }
                else {
                    var o = of.offset();
                    h.atLocation = o.left;
                    v.atLocation = o.top;
                    h.atSize = of.outerWidth();
                    v.atSize = of.outerHeight()
                }
            }
            initMyLocation(h);
            initMyLocation(v);
            var bounds = function() {
                    var win = $(window),
                        left = win.scrollLeft(),
                        top = win.scrollTop();
                    if (scrollbarWidth === undefined)
                        scrollbarWidth = calculateScrollbarWidth();
                    var hScrollbar = document.width > document.documentElement.clientWidth,
                        vScrollbar = document.height > document.documentElement.clientHeight,
                        hZoomLevel = DX.support.touch ? document.documentElement.clientWidth / (vScrollbar ? window.innerWidth - scrollbarWidth : window.innerWidth) : 1,
                        vZoomLevel = DX.support.touch ? document.documentElement.clientHeight / (hScrollbar ? window.innerHeight - scrollbarWidth : window.innerHeight) : 1;
                    return {
                            h: {
                                min: left,
                                max: left + win.width() / hZoomLevel - h.mySize
                            },
                            v: {
                                min: top,
                                max: top + win.height() / vZoomLevel - v.mySize
                            }
                        }
                }();
            if (decolliders[h.collision])
                decolliders[h.collision](h, bounds.h);
            if (decolliders[v.collision])
                decolliders[v.collision](v, bounds.v);
            $what.offset({
                left: Math.round(h.myLocation),
                top: Math.round(v.myLocation)
            })
        };
    DX.position = position;
    var calculateScrollbarWidth = function() {
            var $scrollDiv = $("<div>").css({
                    width: 100,
                    height: 100,
                    overflow: "scroll",
                    position: "absolute",
                    top: -9999
                }).appendTo($("body")),
                result = $scrollDiv.get(0).offsetWidth - $scrollDiv.get(0).clientWidth;
            $scrollDiv.remove();
            return result
        }
})(jQuery, DevExpress);

// Module core, file action.js

(function($, DX, undefined) {
    var actionExecutors = {};
    var registerExecutor = function(name, executor) {
            if ($.isPlainObject(name)) {
                $.each(name, registerExecutor);
                return
            }
            actionExecutors[name] = executor
        };
    var unregisterExecutor = function(name) {
            var args = $.makeArray(arguments);
            $.each(args, function() {
                delete actionExecutors[this]
            })
        };
    registerExecutor({
        func: {execute: function(e) {
                if ($.isFunction(e.action)) {
                    e.result = e.action.apply(e.context, e.args);
                    e.handled = true
                }
            }},
        url: {execute: function(e) {
                if (typeof e.action === "string" && e.action.charAt(0) !== "#")
                    document.location = e.action
            }},
        hash: {execute: function(e) {
                if (typeof e.action === "string" && e.action.charAt(0) === "#")
                    document.location.hash = e.action
            }}
    });
    var Action = DX.Class.inherit({
            ctor: function(action, config) {
                config = config || {};
                this._action = action || $.noop;
                this._context = config.context || window;
                this._beforeExecute = config.beforeExecute || $.noop;
                this._afterExecute = config.afterExecute || $.noop;
                this._component = config.component
            },
            execute: function() {
                var e = {
                        action: this._action,
                        args: Array.prototype.slice.call(arguments),
                        context: this._context,
                        component: this._component,
                        canceled: false,
                        handled: false
                    };
                if (!this._validateAction(e))
                    return;
                this._beforeExecute.call(this._context, e);
                if (e.canceled)
                    return;
                var result = this._executeAction(e);
                this._afterExecute.call(this._context, e);
                return result
            },
            _validateAction: function(e) {
                $.each(actionExecutors, function(index, executor) {
                    if (executor.validate)
                        executor.validate(e);
                    if (e.canceled)
                        return false
                });
                return !e.canceled
            },
            _executeAction: function(e) {
                var result;
                $.each(actionExecutors, function(index, executor) {
                    if (executor.execute)
                        executor.execute(e);
                    if (e.handled) {
                        result = e.result;
                        return false
                    }
                });
                return result
            }
        });
    $.extend(DX, {
        registerActionExecutor: registerExecutor,
        unregisterActionExecutor: unregisterExecutor,
        Action: Action
    });
    DX.__internals = {actionExecutors: actionExecutors}
})(jQuery, DevExpress);

// Module core, file utils.js

(function($, DX, undefined) {
    var PI = Math.PI,
        LN10 = Math.LN10;
    var cos = Math.cos,
        sin = Math.sin,
        abs = Math.abs,
        log = Math.log,
        floor = Math.floor,
        ceil = Math.ceil,
        max = Math.max,
        min = Math.min,
        isNaN = window.isNaN,
        Number = window.Number,
        NaN = window.NaN;
    var dateUnitIntervals = ['millisecond', 'second', 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year'];
    var isDefined = function(object) {
            return object !== null && object !== undefined
        };
    var isString = function(object) {
            return $.type(object) === 'string'
        };
    var isNumber = function(object) {
            return $.isNumeric(object)
        };
    var isObject = function(object) {
            return $.type(object) === 'object'
        };
    var isArray = function(object) {
            return $.type(object) === 'array'
        };
    var isDate = function(object) {
            return $.type(object) === 'date'
        };
    var isFunction = function(object) {
            return $.type(object) === 'function'
        };
    var toMilliseconds = function(value) {
            switch (value) {
                case'millisecond':
                    return 1;
                case'second':
                    return toMilliseconds('millisecond') * 1000;
                case'minute':
                    return toMilliseconds('second') * 60;
                case'hour':
                    return toMilliseconds('minute') * 60;
                case'day':
                    return toMilliseconds('hour') * 24;
                case'week':
                    return toMilliseconds('day') * 7;
                case'month':
                    return toMilliseconds('day') * 30;
                case'quarter':
                    return toMilliseconds('month') * 3;
                case'year':
                    return toMilliseconds('day') * 365;
                default:
                    return 0
            }
        };
    var convertDateUnitToMilliseconds = function(dateUnit, count) {
            return toMilliseconds(dateUnit) * count
        };
    var convertMillisecondsToDateUnits = function(value) {
            var i,
                dateUnitCount,
                dateUnitInterval,
                dateUnitIntervals = ['millisecond', 'second', 'minute', 'hour', 'day', 'month', 'year'],
                result = {};
            for (i = dateUnitIntervals.length - 1; i >= 0; i--) {
                dateUnitInterval = dateUnitIntervals[i];
                dateUnitCount = Math.floor(value / toMilliseconds(dateUnitInterval));
                if (dateUnitCount > 0) {
                    result[dateUnitInterval + 's'] = dateUnitCount;
                    value -= convertDateUnitToMilliseconds(dateUnitInterval, dateUnitCount)
                }
            }
            return result
        };
    var convertDateTickIntervalToMilliseconds = function(tickInterval) {
            var milliseconds = 0;
            if (isObject(tickInterval))
                $.each(tickInterval, function(key, value) {
                    milliseconds += convertDateUnitToMilliseconds(key.substr(0, key.length - 1), value)
                });
            if (isString(tickInterval))
                milliseconds = convertDateUnitToMilliseconds(tickInterval, 1);
            return milliseconds
        };
    var getDatesDifferences = function(date1, date2) {
            var differences,
                counter = 0;
            differences = {
                year: date1.getFullYear() !== date2.getFullYear(),
                month: date1.getMonth() !== date2.getMonth(),
                day: date1.getDate() !== date2.getDate(),
                hour: date1.getHours() !== date2.getHours(),
                minute: date1.getMinutes() !== date2.getMinutes(),
                second: date1.getSeconds() !== date2.getSeconds()
            };
            $.each(differences, function(key, value) {
                if (value)
                    counter++
            });
            differences.count = counter;
            return differences
        };
    var getFraction = function(value) {
            var valueString,
                indexPoint;
            if (isNumber(value)) {
                valueString = value.toFixed(20);
                indexPoint = valueString.indexOf('.');
                return valueString.substr(indexPoint + 1, valueString.length - indexPoint + 1)
            }
            return ''
        };
    var getSignificantDigitPosition = function(value) {
            var fraction = getFraction(value),
                i;
            if (fraction)
                for (i = 0; i < fraction.length; i++)
                    if (fraction.charAt(i) !== '0')
                        return i + 1;
            return 0
        };
    var addSubValues = function(value1, value2, isSub) {
            return value1 + (isSub ? -1 : 1) * value2
        };
    var isExponential = function(value) {
            return isNumber(value) && value.toString().indexOf('e') !== -1
        };
    var addInterval = function(value, interval, isNegative) {
            var result = null,
                intervalObject;
            if (isDate(value)) {
                intervalObject = isString(interval) ? getDateIntervalByString(interval.toLowerCase()) : interval;
                result = new Date(value.getTime());
                if (intervalObject.years)
                    result.setFullYear(addSubValues(result.getFullYear(), intervalObject.years, isNegative));
                if (intervalObject.quarters)
                    result.setMonth(addSubValues(result.getMonth(), 3 * intervalObject.quarters, isNegative));
                if (intervalObject.months)
                    result.setMonth(addSubValues(result.getMonth(), intervalObject.months, isNegative));
                if (intervalObject.weeks)
                    result.setDate(addSubValues(result.getDate(), 7 * intervalObject.weeks, isNegative));
                if (intervalObject.days)
                    result.setDate(addSubValues(result.getDate(), intervalObject.days, isNegative));
                if (intervalObject.hours)
                    result.setHours(addSubValues(result.getHours(), intervalObject.hours, isNegative));
                if (intervalObject.minutes)
                    result.setMinutes(addSubValues(result.getMinutes(), intervalObject.minutes, isNegative));
                if (intervalObject.seconds)
                    result.setSeconds(addSubValues(result.getSeconds(), intervalObject.seconds, isNegative));
                if (intervalObject.milliseconds)
                    result.setMilliseconds(addSubValues(value.getMilliseconds(), intervalObject.milliseconds, isNegative))
            }
            else
                result = addSubValues(value, interval, isNegative);
            return result
        };
    var getDateUnitInterval = function(tickInterval) {
            var maxInterval = -1,
                i;
            if (isString(tickInterval))
                return tickInterval;
            if (isObject(tickInterval)) {
                $.each(tickInterval, function(key, value) {
                    for (i = 0; i < dateUnitIntervals.length; i++)
                        if (value && (key === dateUnitIntervals[i] + 's' || key === dateUnitIntervals[i]) && maxInterval < i)
                            maxInterval = i
                });
                return dateUnitIntervals[maxInterval]
            }
            return ''
        };
    var correctDateWithUnitBeginning = function(date, dateInterval) {
            var dayMonth,
                firstQuarterMonth,
                dateUnitInterval = getDateUnitInterval(dateInterval);
            switch (dateUnitInterval) {
                case'second':
                    date.setMilliseconds(0);
                    break;
                case'minute':
                    date.setSeconds(0, 0);
                    break;
                case'hour':
                    date.setMinutes(0, 0, 0);
                    break;
                case'year':
                    date.setMonth(0);
                case'month':
                    date.setDate(1);
                case'day':
                    date.setHours(0, 0, 0, 0);
                    break;
                case'week':
                    dayMonth = date.getDate();
                    if (date.getDay() !== 0)
                        dayMonth += 7 - date.getDay();
                    date.setDate(dayMonth);
                    date.setHours(0, 0, 0, 0);
                    break;
                case'quarter':
                    firstQuarterMonth = DX.formatHelper.getFirstQuarterMonth(date.getMonth());
                    if (date.getMonth() !== firstQuarterMonth)
                        date.setMonth(firstQuarterMonth);
                    date.setDate(1);
                    date.setHours(0, 0, 0, 0);
                    break
            }
        };
    var roundValue = function(value, precision) {
            if (isNumber(value))
                if (isExponential(value))
                    return Number(value.toExponential(precision));
                else
                    return Number(value.toFixed(precision))
        };
    var getPrecision = function(value) {
            var stringFraction,
                stringValue = value.toString(),
                pointIndex = stringValue.indexOf('.');
            if (pointIndex !== -1) {
                stringFraction = stringValue.substring(pointIndex + 1);
                return stringFraction.length
            }
            return 0
        };
    var applyPrecisionByMinDelta = function(min, delta, value) {
            var minPrecision = getPrecision(min),
                deltaPrecision = getPrecision(delta);
            return roundValue(value, minPrecision < deltaPrecision ? deltaPrecision : minPrecision)
        };
    var adjustValue = function(value) {
            var fraction = getFraction(value),
                nextValue,
                i;
            if (fraction)
                for (i = 1; i <= fraction.length; i++) {
                    nextValue = roundValue(value, i);
                    if (nextValue !== 0 && fraction[i - 2] && fraction[i - 1] && fraction[i - 2] === fraction[i - 1])
                        return nextValue
                }
            return value
        };
    var getDateIntervalByString = function(intervalString) {
            var result = {};
            switch (intervalString) {
                case'year':
                    result.years = 1;
                    break;
                case'month':
                    result.months = 1;
                    break;
                case'quarter':
                    result.months = 3;
                    break;
                case'week':
                    result.days = 7;
                    break;
                case'day':
                    result.days = 1;
                    break;
                case'hour':
                    result.hours = 1;
                    break;
                case'minute':
                    result.minutes = 1;
                    break;
                case'second':
                    result.seconds = 1;
                    break;
                case'millisecond':
                    result.milliseconds = 1;
                    break
            }
            return result
        };
    var normalizeAngle = function(angle) {
            return (angle % 360 + 360) % 360
        };
    var convertAngleToRendererSpace = function(angle) {
            return 90 - angle
        };
    var degreesToRadians = function(value) {
            return PI * value / 180
        };
    var getCosAndSin = function(angle) {
            var angleInRadians = degreesToRadians(angle);
            return {
                    cos: cos(angleInRadians),
                    sin: sin(angleInRadians)
                }
        };
    var DECIMAL_ORDER_THRESHOLD = 1E-14;
    var getDecimalOrder = function(number) {
            var n = abs(number),
                cn;
            if (!isNaN(n)) {
                if (n > 0) {
                    n = log(n) / LN10;
                    cn = ceil(n);
                    return cn - n < DECIMAL_ORDER_THRESHOLD ? cn : floor(n)
                }
                return 0
            }
            return NaN
        };
    var getAppropriateFormat = function(start, end, count) {
            var order = max(getDecimalOrder(start), getDecimalOrder(end)),
                precision = -getDecimalOrder(abs(end - start) / count),
                format;
            if (!isNaN(order) && !isNaN(precision)) {
                if (abs(order) <= 4) {
                    format = 'fixedPoint';
                    precision < 0 && (precision = 0);
                    precision > 4 && (precision = 4)
                }
                else {
                    format = 'exponential';
                    precision += order - 1;
                    precision > 3 && (precision = 3)
                }
                return {
                        format: format,
                        precision: precision
                    }
            }
            return null
        };
    var createResizeHandler = function(callback) {
            var $window = $(window),
                timeout;
            var debug_callback = arguments[1];
            var handler = function() {
                    var width = $window.width(),
                        height = $window.height();
                    clearTimeout(timeout);
                    timeout = setTimeout(function() {
                        $window.width() === width && $window.height() === height && callback();
                        debug_callback && debug_callback()
                    }, 100)
                };
            handler.stop = function() {
                clearTimeout(timeout);
                return this
            };
            return handler
        };
    var logger = function() {
            var info = function() {
                    if (window.console && arguments[0])
                        console.info(arguments[0])
                };
            var warn = function() {
                    if (window.console && arguments[0])
                        console.warn(arguments[0])
                };
            var error = function() {
                    if (window.console && arguments[0])
                        console.error(arguments[0])
                };
            return {
                    info: info,
                    warn: warn,
                    error: error
                }
        }();
    var debug = function() {
            function assert(condition, message) {
                if (!condition)
                    throw new Error(message);
            }
            function assertParam(parameter, message) {
                assert(parameter !== null && parameter !== undefined, message)
            }
            return {
                    assert: assert,
                    assertParam: assertParam
                }
        }();
    var windowResizeCallbacks = function() {
            var prevSize,
                callbacks = $.Callbacks(),
                jqWindow = $(window);
            var formatSize = function() {
                    return [jqWindow.width(), jqWindow.height()].join()
                };
            var handleResize = function() {
                    var now = formatSize();
                    if (now === prevSize)
                        return;
                    prevSize = now;
                    callbacks.fire()
                };
            jqWindow.on("resize", handleResize);
            prevSize = formatSize();
            return callbacks
        }();
    var createMarkupFromString = function(str) {
            var tempElement = $("<div />");
            if (window.WinJS)
                WinJS.Utilities.setInnerHTMLUnsafe(tempElement.get(0), str);
            else
                tempElement.append(str);
            return tempElement.contents()
        };
    var numClipRect = 1;
    var numPattern = 1;
    var getNextClipId = function() {
            return 'DevExpress_' + numClipRect++
        };
    var getNextPatternId = function() {
            return 'DevExpressPattern_' + numPattern++
        };
    var extendFromDataAttributes = function(target, $el, overrideExistingValues) {
            target = target || {};
            var source = {};
            var prefix = "data-dx-";
            var attributes = $el.get(0).attributes;
            for (var i = 0; i < attributes.length; i++) {
                var name = attributes[i].name;
                if (name.indexOf(prefix) === 0) {
                    var propertyName = DX.inflector.camelize(name.substr(prefix.length));
                    source[propertyName] = attributes[i].value
                }
            }
            return extendFromObject(target, source, overrideExistingValues)
        };
    var extendFromObject = function(target, source, overrideExistingValues) {
            target = target || {};
            for (var prop in source)
                if (source.hasOwnProperty(prop)) {
                    var value = source[prop];
                    if (!(prop in target) || overrideExistingValues)
                        target[prop] = value
                }
            return target
        };
    var subscribeEventToDocument = function(event, handler, data) {
            var currentWindow = window;
            $(document).on(event, data, handler);
            while (currentWindow.parent && currentWindow.parent !== currentWindow) {
                currentWindow = currentWindow.parent;
                $(currentWindow.document).on(event, data, handler)
            }
        };
    var unsubscribeEventFromDocument = function(event) {
            var currentWindow = window;
            $(document).off(event);
            while (currentWindow.parent && currentWindow.parent !== currentWindow) {
                currentWindow = currentWindow.parent;
                $(currentWindow.document).off(event)
            }
        };
    function Clone(){}
    var clone = function(obj) {
            Clone.prototype = obj;
            return new Clone
        };
    var executeAsync = function(action, context) {
            var deferred = $.Deferred(),
                normalizedContext = context || this;
            setTimeout(function() {
                var result = action.call(normalizedContext);
                if (result && result.done && $.isFunction(result.done))
                    result.done(function() {
                        deferred.resolveWith(normalizedContext)
                    });
                else
                    deferred.resolveWith(normalizedContext)
            }, 0);
            return deferred.promise()
        };
    DX.utils = {
        dateUnitIntervals: dateUnitIntervals,
        isDefined: isDefined,
        isString: isString,
        isNumber: isNumber,
        isObject: isObject,
        isArray: isArray,
        isDate: isDate,
        isFunction: isFunction,
        normalizeAngle: normalizeAngle,
        convertAngleToRendererSpace: convertAngleToRendererSpace,
        degreesToRadians: degreesToRadians,
        getCosAndSin: getCosAndSin,
        getDecimalOrder: getDecimalOrder,
        getAppropriateFormat: getAppropriateFormat,
        getFraction: getFraction,
        adjustValue: adjustValue,
        convertMillisecondsToDateUnits: convertMillisecondsToDateUnits,
        convertDateTickIntervalToMilliseconds: convertDateTickIntervalToMilliseconds,
        convertDateUnitToMilliseconds: convertDateUnitToMilliseconds,
        getDateUnitInterval: getDateUnitInterval,
        getDatesDifferences: getDatesDifferences,
        correctDateWithUnitBeginning: correctDateWithUnitBeginning,
        roundValue: roundValue,
        isExponential: isExponential,
        applyPrecisionByMinDelta: applyPrecisionByMinDelta,
        getSignificantDigitPosition: getSignificantDigitPosition,
        addInterval: addInterval,
        getDateIntervalByString: getDateIntervalByString,
        logger: logger,
        debug: debug,
        createResizeHandler: createResizeHandler,
        windowResizeCallbacks: windowResizeCallbacks,
        createMarkupFromString: createMarkupFromString,
        getNextClipId: getNextClipId,
        getNextPatternId: getNextPatternId,
        extendFromDataAttributes: extendFromDataAttributes,
        extendFromObject: extendFromObject,
        subscribeEventToDocument: subscribeEventToDocument,
        unsubscribeEventFromDocument: unsubscribeEventFromDocument,
        clone: clone,
        executeAsync: executeAsync
    }
})(jQuery, DevExpress);

// Module core, file translator.js

(function($, DX, undefined) {
    var support = DX.support,
        TRANSFORM_MATRIX_REGEX = /matrix(3d)?\((.+?)\)/,
        TRANSLATE_REGEX = /translate(?:3d)?\((.+?)\)/;
    var locate = function($element) {
            var result,
                position;
            if (support.transform3d) {
                var translate = getTranslate($element);
                result = {
                    left: translate.x,
                    top: translate.y
                }
            }
            else {
                position = $element.position();
                result = {
                    left: position.left,
                    top: position.top
                }
            }
            return result
        };
    var move = function($element, position) {
            if (!support.transform3d) {
                $element.css(position);
                return
            }
            var translate = getTranslate($element),
                left = position.left,
                top = position.top;
            if (left !== undefined)
                translate.x = left;
            if (top !== undefined)
                translate.y = top;
            $element.css("transform", getTranslateCss(translate))
        };
    var getTranslate = function($element) {
            var transformValue = $element.css("transform"),
                matrix = transformValue.match(TRANSFORM_MATRIX_REGEX),
                is3D = matrix && matrix[1];
            if (matrix) {
                matrix = matrix[2].split(",");
                if (is3D === "3d")
                    matrix = matrix.slice(12, 15);
                else {
                    matrix.push(0);
                    matrix = matrix.slice(4, 7)
                }
            }
            else
                matrix = [0, 0, 0];
            return {
                    x: parseFloat(matrix[0]),
                    y: parseFloat(matrix[1]),
                    z: parseFloat(matrix[2])
                }
        };
    var parseTranslate = function(translateString) {
            var result = translateString.match(TRANSLATE_REGEX);
            if (!result || !result[1])
                return;
            result = result[1].split(",");
            result = {
                x: parseFloat(result[0]),
                y: parseFloat(result[1]),
                z: parseFloat(result[2])
            };
            return result
        };
    var getTranslateCss = function(translate) {
            return "translate3d(" + (translate.x || 0) + "px, " + (translate.y || 0) + "px, " + (translate.z || 0) + "px)"
        };
    DX.translator = {
        move: move,
        locate: locate,
        parseTranslate: parseTranslate,
        getTranslate: getTranslate,
        getTranslateCss: getTranslateCss
    }
})(jQuery, DevExpress);

// Module core, file devices.js

(function($, DX, undefined) {
    var knownUATable = {
            iPhone: "iPhone",
            iPhone5: "iPhone 5",
            iPad: "iPad",
            iPadMini: "iPad Mini",
            androidPhone: "Android Mobile",
            androidTablet: "Android",
            win8: "MSAppHost",
            win8Phone: "Windows Phone 8",
            msSurface: "MSIE ARM Tablet PC",
            desktop: "desktop"
        },
        deviceDefault = {
            phone: false,
            tablet: false,
            android: false,
            ios: false,
            win8: false
        },
        desktopDevice = $.extend(deviceDefault, {platform: "desktop"});
    var fromUA = function(ua) {
            var ipad = /ipad/i.test(ua),
                iphone = /iphone|ipod/i.test(ua),
                android = /android|silk-accelerated/i.test(ua),
                win8Phone = /windows phone 8/i.test(ua),
                msSurface = /msie(.*)arm(.*)tablet\spc/i.test(ua),
                win8 = /msapphost/i.test(ua) || win8Phone || msSurface;
            if (!ipad && !iphone && !android && !win8 && !win8Phone && !msSurface)
                return $.extend({}, desktopDevice);
            var phone = iphone || android && /mobile/i.test(ua) || win8Phone,
                tablet = !phone && !win8 && !win8Phone,
                name = android ? "android" : win8 ? "win8" : "ios";
            return {
                    phone: phone,
                    tablet: tablet,
                    android: android,
                    ios: ipad || iphone,
                    win8: name === "win8",
                    platform: name
                }
        };
    var getDevice = function(deviceName) {
            var ua;
            if (deviceName) {
                ua = knownUATable[deviceName];
                if (!ua)
                    throw Error("Unknown device");
            }
            else
                ua = navigator.userAgent;
            return fromUA(ua)
        };
    var androidVersion = function(userAgent) {
            userAgent = userAgent || window.navigator.userAgent;
            var matches = /Android (\d\.\d(?:\.\d)?)/.exec(userAgent);
            if (matches && matches.length === 2)
                return matches[1]
        };
    var device;
    var current = function(deviceOrName) {
            if (deviceOrName)
                if ($.isPlainObject(deviceOrName))
                    device = $.extend(deviceDefault, deviceOrName);
                else
                    device = getDevice(deviceOrName);
            else {
                if (!device) {
                    var deviceName = undefined;
                    if (window.top["dx-force-device"])
                        deviceName = window.top["dx-force-device"];
                    else
                        deviceName = window.sessionStorage && (sessionStorage.getItem("dx-force-device") || sessionStorage.getItem("dx-simulator-device"));
                    device = getDevice(deviceName)
                }
                return device
            }
        };
    DX.devices = {
        androidVersion: androidVersion,
        current: current,
        fromUA: function() {
            return fromUA(navigator.userAgent)
        }
    }
})(jQuery, DevExpress);

// Module core, file fx.js

(function($, DX, undefined) {
    var translator = DX.translator,
        support = DX.support,
        transitionEndEventName = support.transitionEndEventName + ".dxFX";
    var CSS_TRANSITION_EASING_REGEX = /cubic-bezier\((\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\)/,
        SIMULATED_TRANSITIONEND_TIMEOUT_DATA_KEY = "dxSimulatedTransitionTimeoutKey",
        ANIM_DATA_KEY = "dxAnimData",
        TRANSFORM_PROP = "transform",
        BACKFACEVISIBILITY_PROP = "backfaceVisibility",
        FRAME_ANIMATION_STEP_TIME = 1000 / 60;
    var TransitionAnimationStrategy = {
            animate: function($element, config) {
                var deferred = $.Deferred(),
                    transitionEndFired = $.Deferred(),
                    simulatedTransitionEndFired = $.Deferred();
                $element.one(transitionEndEventName, function() {
                    transitionEndFired.reject()
                });
                $element.data(SIMULATED_TRANSITIONEND_TIMEOUT_DATA_KEY, setTimeout(function() {
                    simulatedTransitionEndFired.reject()
                }, config.duration + config.delay));
                $.when(transitionEndFired, simulatedTransitionEndFired).fail($.proxy(function() {
                    this._cleanup($element);
                    deferred.resolveWith($element, [config, $element])
                }, this));
                translator.getTranslate($element);
                $element.css({
                    transitionProperty: "all",
                    transitionDelay: config.delay + "ms",
                    transitionDuration: config.duration + "ms",
                    transitionTimingFunction: config.easing
                });
                setProps($element, config.to);
                if (!config.duration)
                    $element.trigger(transitionEndEventName);
                return deferred.promise()
            },
            _cleanup: function($element) {
                $element.css("transition", "none").off(transitionEndEventName);
                var simulatedEndEventTimer = $element.data(SIMULATED_TRANSITIONEND_TIMEOUT_DATA_KEY);
                clearTimeout(simulatedEndEventTimer);
                $element.removeData(SIMULATED_TRANSITIONEND_TIMEOUT_DATA_KEY)
            },
            stop: function($element, jumpToEnd) {
                var config = $element.data(ANIM_DATA_KEY);
                if (!config)
                    return;
                if (jumpToEnd)
                    $element.trigger(transitionEndEventName);
                else {
                    $.each(config.to, function(key) {
                        $element.css(key, $element.css(key))
                    });
                    this._cleanup($element)
                }
            }
        };
    var requestAnimationFrame = function() {
            return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback, element) {
                    window.setTimeout(callback, FRAME_ANIMATION_STEP_TIME)
                }
        }();
    var FrameAnimationStrategy = {
            animate: function($element, config) {
                var deferred = $.Deferred(),
                    animationData = $element.data(ANIM_DATA_KEY),
                    self = this;
                if (!animationData)
                    return deferred.reject().promise();
                $.each(config.to, function(prop) {
                    if (config.from[prop] === undefined)
                        config.from[prop] = self._normalizeValue($element.css(prop))
                });
                if (config.to[TRANSFORM_PROP]) {
                    config.from[TRANSFORM_PROP] = self._parseTransform(config.from[TRANSFORM_PROP]);
                    config.to[TRANSFORM_PROP] = self._parseTransform(config.to[TRANSFORM_PROP])
                }
                animationData.frameAnimation = {
                    to: config.to,
                    from: config.from,
                    currentValue: config.from,
                    easing: convertTransitionTimingFuncToJQueryEasing(config.easing),
                    duration: config.duration,
                    startTime: (new Date).valueOf(),
                    finish: function() {
                        this.currentValue = this.to;
                        this.draw();
                        deferred.resolve()
                    },
                    draw: function() {
                        var currentValue = $.extend({}, this.currentValue);
                        if (currentValue[TRANSFORM_PROP])
                            currentValue[TRANSFORM_PROP] = $.map(currentValue[TRANSFORM_PROP], function(value, prop) {
                                if (prop === "translate")
                                    return translator.getTranslateCss(value);
                                else if (prop === "scale")
                                    return "scale(" + value + ")";
                                else if (prop.substr(0, prop.length - 1) === "rotate")
                                    return prop + "(" + value + "deg)"
                            }).join(" ");
                        $element.css(currentValue)
                    }
                };
                if (config.delay) {
                    animationData.frameAnimation.startTime += config.delay;
                    animationData.frameAnimation.delayTimeout = setTimeout(function() {
                        self._animationStep($element)
                    }, config.delay)
                }
                else
                    self._animationStep($element);
                return deferred.promise()
            },
            _parseTransform: function(transformString) {
                var result = {};
                $.each(transformString.match(/(\w|\d)+\([^\)]*\)\s*/g), function(i, part) {
                    var translateData = translator.parseTranslate(part),
                        scaleData = part.match(/scale\((.+?)\)/),
                        rotateData = part.match(/(rotate.)\((.+)deg\)/);
                    if (translateData)
                        result.translate = translateData;
                    if (scaleData && scaleData[1])
                        result.scale = parseFloat(scaleData[1]);
                    if (rotateData && rotateData[1])
                        result[rotateData[1]] = parseFloat(rotateData[2])
                });
                return result
            },
            stop: function($element, jumpToEnd) {
                var animationData = $element.data(ANIM_DATA_KEY),
                    frameAnimation = animationData && animationData.frameAnimation;
                if (!frameAnimation)
                    return;
                clearTimeout(frameAnimation.delayTimeout);
                if (jumpToEnd)
                    frameAnimation.finish()
            },
            _animationStep: function($element) {
                var animationData = $element.data(ANIM_DATA_KEY),
                    frameAnimation = animationData && animationData.frameAnimation;
                if (!frameAnimation)
                    return;
                var now = (new Date).valueOf();
                if (now >= frameAnimation.startTime + frameAnimation.duration) {
                    frameAnimation.finish();
                    return
                }
                frameAnimation.currentValue = this._calcStepValue(frameAnimation, now - frameAnimation.startTime);
                frameAnimation.draw();
                requestAnimationFrame($.proxy(function() {
                    this._animationStep($element)
                }, this))
            },
            _calcStepValue: function(frameAnimation, currentDuration) {
                var calcValueRecursively = function(from, to) {
                        var result = $.isArray(to) ? [] : {};
                        var calcEasedValue = function(propName) {
                                var x = currentDuration / frameAnimation.duration,
                                    t = currentDuration,
                                    b = 1 * from[propName],
                                    c = to[propName] - from[propName],
                                    d = frameAnimation.duration;
                                return $.easing[frameAnimation.easing](x, t, b, c, d)
                            };
                        $.each(to, function(propName, endPropValue) {
                            if (typeof endPropValue === "string" && parseFloat(endPropValue, 10) === false)
                                return true;
                            result[propName] = typeof endPropValue === "object" ? calcValueRecursively(from[propName], endPropValue) : calcEasedValue(propName)
                        });
                        return result
                    };
                return calcValueRecursively(frameAnimation.from, frameAnimation.to)
            },
            _normalizeValue: function(value) {
                var numericValue = parseFloat(value, 10);
                if (numericValue === false)
                    return value;
                return numericValue
            }
        };
    var animationStrategies = {
            transition: support.transition ? TransitionAnimationStrategy : FrameAnimationStrategy,
            frame: FrameAnimationStrategy
        };
    var getAnimationStrategy = function(config) {
            return animationStrategies[config && config.strategy || "transition"]
        };
    var TransitionTimingFuncMap = {
            linear: "cubic-bezier(0, 0, 1, 1)",
            ease: "cubic-bezier(0.25, 0.1, 0.25, 1)",
            "ease-in": "cubic-bezier(0.42, 0, 1, 1)",
            "ease-out": "cubic-bezier(0, 0, 0.58, 1)",
            "ease-in-out": "cubic-bezier(0.42, 0, 0.58, 1)"
        };
    var convertTransitionTimingFuncToJQueryEasing = function(cssTransitionEasing) {
            cssTransitionEasing = TransitionTimingFuncMap[cssTransitionEasing] || cssTransitionEasing;
            var bezCoeffs = cssTransitionEasing.match(CSS_TRANSITION_EASING_REGEX);
            if (!bezCoeffs)
                return "linear";
            bezCoeffs = bezCoeffs.slice(1, 5);
            $.each(bezCoeffs, function(index, value) {
                bezCoeffs[index] = parseFloat(value)
            });
            var easingName = "cubicbezier_" + bezCoeffs.join("_").replace(/\./g, "p");
            if (!$.isFunction($.easing[easingName])) {
                var polynomBezier = function(x1, y1, x2, y2) {
                        var Cx = 3 * x1,
                            Bx = 3 * (x2 - x1) - Cx,
                            Ax = 1 - Cx - Bx,
                            Cy = 3 * y1,
                            By = 3 * (y2 - y1) - Cy,
                            Ay = 1 - Cy - By;
                        var bezierX = function(t) {
                                return t * (Cx + t * (Bx + t * Ax))
                            };
                        var bezierY = function(t) {
                                return t * (Cy + t * (By + t * Ay))
                            };
                        var findXfor = function(t) {
                                var x = t,
                                    i = 0,
                                    z;
                                while (i < 14) {
                                    z = bezierX(x) - t;
                                    if (Math.abs(z) < 1e-3)
                                        break;
                                    x = x - z / derivativeX(x);
                                    i++
                                }
                                return x
                            };
                        var derivativeX = function(t) {
                                return Cx + t * (2 * Bx + t * 3 * Ax)
                            };
                        return function(t) {
                                return bezierY(findXfor(t))
                            }
                    };
                $.easing[easingName] = function(x, t, b, c, d) {
                    return c * polynomBezier(bezCoeffs[0], bezCoeffs[1], bezCoeffs[2], bezCoeffs[3])(t / d) + b
                }
            }
            return easingName
        };
    var NoneAnimationConfigurator = {setup: function($element, config){}};
    var SlideAnimationConfigurator = {
            setup: function($element, config) {
                var animStrategy = getAnimationStrategy(config);
                if (!support.transform3d || animStrategy !== TransitionAnimationStrategy && animStrategy !== FrameAnimationStrategy)
                    return;
                this._setupConfig($element, config.from);
                this._setupConfig($element, config.to)
            },
            _setupConfig: function($element, config) {
                var translate = translator.getTranslate($element),
                    left = config.left,
                    top = config.top;
                if (left !== undefined) {
                    translate.x = left;
                    delete config.left
                }
                if (top !== undefined) {
                    translate.y = top;
                    delete config.top
                }
                config[TRANSFORM_PROP] = translator.getTranslateCss(translate)
            }
        };
    var FadeAnimationConfigurator = {setup: function($element, config) {
                var from = config.from,
                    fromOpacity = $.isPlainObject(from) ? $element.css("opacity") : String(from),
                    toOpacity = String(config.to);
                config.from = {opacity: fromOpacity};
                config.to = {opacity: toOpacity}
            }};
    var PopAnimationConfigurator = {
            setup: function($element, config) {
                if (!support.transform3d)
                    return;
                var from = config.from,
                    to = config.to,
                    fromOpacity = "opacity" in from ? from.opacity : $element.css("opacity"),
                    toOpacicy = "opacity" in to ? to.opacity : 1,
                    fromScale = "scale" in from ? from.scale : 0,
                    toScale = "scale" in to ? to.scale : 1;
                config.from = {opacity: fromOpacity};
                config.from[TRANSFORM_PROP] = this._getCssTransform(fromScale);
                config.to = {opacity: toOpacicy};
                config.to[TRANSFORM_PROP] = this._getCssTransform(toScale)
            },
            _getCssTransform: function(scale) {
                return "scale(" + scale + ")"
            }
        };
    var FlipAnimationConfigurator = {
            DIRECTIONS: ["left", "right", "top", "bottom"],
            setup: function($element, config) {
                if (!support.transform3d)
                    return;
                var from = config.from,
                    to = config.to,
                    direction = this._normalizeDirection(to.direction),
                    directionFactor = this._getDirectionFactor(direction),
                    axis = this._getAxis(direction),
                    fromRotate = "rotate" in from ? from.rotate : -directionFactor * 180,
                    toRotate = "rotate" in to ? to.rotate : directionFactor * 180,
                    fromScale = "scale" in from ? from.scale : directionFactor === 1 ? 1 : 0.8,
                    toScale = "scale" in to ? to.scale : directionFactor === 1 ? 0.8 : 1;
                config.from[TRANSFORM_PROP] = this._getCssTransform(axis, fromRotate, fromScale);
                config.from[BACKFACEVISIBILITY_PROP] = "hidden";
                config.to[TRANSFORM_PROP] = this._getCssTransform(axis, toRotate, toScale);
                config.to[BACKFACEVISIBILITY_PROP] = "hidden"
            },
            _normalizeDirection: function(direction) {
                var index = $.inArray(this.DIRECTIONS);
                if (index !== -1)
                    return direction;
                return "left"
            },
            _getAxis: function(direction) {
                if (direction === "left" || direction === "right")
                    return "Y";
                if (direction === "top" || direction === "bottom")
                    return "X"
            },
            _getDirectionFactor: function(direction) {
                if (direction === "left" || direction === "top")
                    return -1;
                if (direction === "right" || direction === "bottom")
                    return 1
            },
            _getCssTransform: function(axis, rotate, scale) {
                return "rotate" + axis + "(" + rotate + "deg) scale(" + scale + ")"
            }
        };
    var animationConfigurators = {
            none: NoneAnimationConfigurator,
            slide: SlideAnimationConfigurator,
            fade: FadeAnimationConfigurator,
            pop: PopAnimationConfigurator,
            flip: FlipAnimationConfigurator
        };
    var getAnimationConfigurator = function(type) {
            var result = animationConfigurators[type];
            if (!result)
                throw Error("Unknown animation type \"" + type + "\"");
            return result
        };
    var defaultConfig = {
            type: "none",
            from: {},
            to: {},
            duration: 400,
            complete: $.noop,
            easing: "ease",
            delay: 0
        };
    var animate = function(element, config) {
            var $element = $(element);
            config = $.extend(true, {}, defaultConfig, config);
            getAnimationConfigurator(config.type).setup($element, config);
            stop($element);
            setProps($element, config.from);
            return executeAnimation($element, config).done(config.complete)
        };
    var setProps = function($element, props) {
            $.each(props, function(key, value) {
                $element.css(key, value)
            })
        };
    var executeAnimation = function($element, config) {
            var deferred = $.Deferred();
            $element.data(ANIM_DATA_KEY, config);
            if (DX.fx.off)
                config.duration = 0;
            getAnimationStrategy(config).animate($element, config).done(function() {
                $element.removeData(ANIM_DATA_KEY);
                deferred.resolveWith(this, [$element, config])
            });
            return deferred.promise()
        };
    var animating = function($element) {
            return !!$element.data(ANIM_DATA_KEY)
        };
    var stop = function(element, jumpToEnd) {
            var $element = $(element);
            getAnimationStrategy($element.data(ANIM_DATA_KEY)).stop($element, jumpToEnd);
            $element.removeData(ANIM_DATA_KEY)
        };
    DX.fx = {
        off: false,
        animationTypes: animationConfigurators,
        animate: animate,
        animating: animating,
        stop: stop
    };
    DX.fx.__internals = {convertTransitionTimingFuncToJQueryEasing: convertTransitionTimingFuncToJQueryEasing}
})(jQuery, DevExpress);

// Module core, file endpointSelector.js

(function($, DX, undefined) {
    var location = window.location,
        DXPROXY_HOST = "dxproxy.devexpress.com:8000",
        WIN_JS = location.protocol === "ms-appx:",
        IS_DXPROXY = location.host === DXPROXY_HOST,
        IS_LOCAL = isLocalHostName(location.hostname);
    function isLocalHostName(url) {
        return /^(localhost$|127\.)/i.test(url)
    }
    var extractProxyAppId = function() {
            return location.pathname.split("/")[1]
        };
    var formatProxyUrl = function(localUrl) {
            var urlData = DX.parseUrl(localUrl);
            if (!isLocalHostName(urlData.hostname))
                return localUrl;
            return "http://" + DXPROXY_HOST + "/" + extractProxyAppId() + "_" + urlData.port + urlData.pathname + urlData.search
        };
    var EndpointSelector = DX.EndpointSelector = function(config) {
            this.config = config
        };
    EndpointSelector.prototype = {urlFor: function(key) {
            var bag = this.config[key];
            if (!bag)
                throw Error("Unknown endpoint key");
            if (IS_DXPROXY)
                return formatProxyUrl(bag.local);
            if (bag.production)
                if (WIN_JS && !Debug.debuggerEnabled || !WIN_JS && !IS_LOCAL)
                    return bag.production;
            return bag.local
        }}
})(jQuery, DevExpress);

// Module core, file formatHelper.js

(function($, DX, undefined) {
    var utils = DX.utils;
    DX.NumericFormat = {
        currency: 'C',
        fixedpoint: 'N',
        exponential: '',
        percent: 'P',
        decimal: 'D'
    };
    DX.LargeNumberFormatPostfixes = {
        1: 'K',
        2: 'M',
        3: 'B',
        4: 'T'
    };
    var MAX_LARGE_NUMBER_POWER = 4,
        DECIMAL_BASE = 10;
    DX.LargeNumberFormatPowers = {
        largenumber: 'auto',
        thousands: 1,
        millions: 2,
        billions: 3,
        trillions: 4
    };
    DX.DateTimeFormat = {
        longdate: 'D',
        longtime: 'T',
        monthandday: 'M',
        monthandyear: 'Y',
        quarterandyear: 'qq',
        shortdate: 'd',
        shorttime: 't',
        millisecond: 'fff',
        second: 'T',
        minute: 't',
        hour: 't',
        day: 'dd',
        week: 'dd',
        month: 'MMMM',
        quarter: 'qq',
        year: 'yyyy',
        longdatelongtime: 'D',
        shortdateshorttime: 'd'
    };
    DX.formatHelper = {
        romanDigits: ['I', 'II', 'III', 'IV'],
        _addFormatSeparator: function(format1, format2) {
            var separator = ' ';
            if (format2)
                return format1 + separator + format2;
            return format1
        },
        _getDateTimeFormatPattern: function(dateTimeFormat) {
            return Globalize.findClosestCulture().calendar.patterns[DX.DateTimeFormat[dateTimeFormat.toLowerCase()]]
        },
        _isDateFormatContains: function(format) {
            var result = false;
            $.each(DX.DateTimeFormat, function(key, value) {
                result = key === format.toLowerCase();
                return !result
            });
            return result
        },
        getQuarter: function(month) {
            return Math.floor(month / 3)
        },
        getQuarterString: function(date, format) {
            var resultQuarter = '',
                quarter = this.getQuarter(date.getMonth());
            switch (format) {
                case'q':
                    resultQuarter = this.romanDigits[quarter];
                    break;
                case'qq':
                    resultQuarter = 'Q' + this.romanDigits[quarter];
                    break;
                case'Q':
                    resultQuarter = (quarter + 1).toString();
                    break;
                case'QQ':
                    resultQuarter = 'Q' + (quarter + 1).toString();
                    break
            }
            return resultQuarter
        },
        getFirstQuarterMonth: function(month) {
            return this.getQuarter(month) * 3
        },
        _formatCustomString: function(value, format) {
            var regExp = /qq|q|QQ|Q/g,
                quarterFormat,
                result = '',
                index = 0;
            while (index < format.length) {
                quarterFormat = regExp.exec(format);
                if (!quarterFormat || quarterFormat.index > index)
                    result += Globalize.format(value, format.substring(index, quarterFormat ? quarterFormat.index : format.length));
                if (quarterFormat) {
                    result += this.getQuarterString(value, quarterFormat[0]);
                    index = quarterFormat.index + quarterFormat[0].length
                }
                else
                    index = format.length
            }
            return result
        },
        _parseNumberFormatString: function(format) {
            var formatList,
                formatObject = {};
            if (!format || typeof format !== 'string')
                return;
            formatList = format.toLowerCase().split(' ');
            $.each(formatList, function(index, value) {
                if (value in DX.NumericFormat)
                    formatObject.formatType = value;
                else if (value in DX.LargeNumberFormatPowers)
                    formatObject.power = DX.LargeNumberFormatPowers[value]
            });
            if (formatObject.power && !formatObject.formatType)
                formatObject.formatType = 'fixedpoint';
            if (formatObject.formatType)
                return formatObject
        },
        _calculateNumberPower: function(value, base, minPower, maxPower) {
            var number = Math.abs(value);
            var power = 0;
            if (number > 1)
                while (number && number >= base && (maxPower === undefined || power < maxPower)) {
                    power++;
                    number = number / base
                }
            else if (number > 0 && number < 1)
                while (number < 1 && (minPower === undefined || power > minPower)) {
                    power--;
                    number = number * base
                }
            return power
        },
        _getNumberByPower: function(number, power, base) {
            var result = number;
            while (power > 0) {
                result = result / base;
                power--
            }
            while (power < 0) {
                result = result * base;
                power++
            }
            return result
        },
        _formatNumber: function(value, formatObject, precision) {
            var powerPostfix;
            if (formatObject.power === 'auto')
                formatObject.power = this._calculateNumberPower(value, 1000, 0, MAX_LARGE_NUMBER_POWER);
            if (formatObject.power)
                value = this._getNumberByPower(value, formatObject.power, 1000);
            powerPostfix = DX.LargeNumberFormatPostfixes[formatObject.power] || '';
            return this._formatNumberCore(value, formatObject.formatType, precision) + powerPostfix
        },
        _formatNumberExponential: function(value, precision) {
            var power = this._calculateNumberPower(value, DECIMAL_BASE),
                number = this._getNumberByPower(value, power, DECIMAL_BASE),
                powString;
            precision = precision === undefined ? 1 : precision;
            if (number.toFixed(precision || 0) >= DECIMAL_BASE) {
                power++;
                number = number / DECIMAL_BASE
            }
            powString = (power >= 0 ? '+' : '') + power.toString();
            return this._formatNumberCore(number, 'fixedpoint', precision) + 'E' + powString
        },
        _formatNumberCore: function(value, format, precision) {
            if (format === 'exponential')
                return this._formatNumberExponential(value, precision);
            else
                return Globalize.format(value, DX.NumericFormat[format] + (utils.isNumber(precision) ? precision : 0))
        },
        _formatDate: function(date, format, formatString) {
            var resultFormat = DX.DateTimeFormat[format.toLowerCase()];
            format = format.toLowerCase();
            if (format === 'quarterandyear')
                resultFormat = this.getQuarterString(date, resultFormat) + ' yyyy';
            if (format === 'quarter')
                return this.getQuarterString(date, resultFormat);
            if (format === 'longdatelongtime')
                return this._formatDate(date, 'longdate') + ' ' + this._formatDate(date, 'longtime');
            if (format === 'shortdateshorttime')
                return this._formatDate(date, 'shortDate') + ' ' + this._formatDate(date, 'shortTime');
            return Globalize.format(date, resultFormat)
        },
        format: function(value, format, precision) {
            if (format && format.format)
                if (format.dateType)
                    return this._formatDateEx(value, format);
                else if (utils.isNumber(value) && isFinite(value))
                    return this._formatNumberEx(value, format);
            return this._format(value, format, precision)
        },
        _format: function(value, format, precision) {
            var numberFormatObject;
            if (!utils.isString(format) || format === '' || !utils.isNumber(value) && !utils.isDate(value))
                return utils.isDefined(value) ? value.toString() : '';
            numberFormatObject = this._parseNumberFormatString(format);
            if (utils.isNumber(value) && numberFormatObject)
                return this._formatNumber(value, numberFormatObject, precision);
            if (utils.isDate(value) && this._isDateFormatContains(format))
                return this._formatDate(value, format);
            if (!numberFormatObject && !this._isDateFormatContains(format))
                return this._formatCustomString(value, format)
        },
        _formatNumberEx: function(value, formatInfo) {
            var self = this,
                numericFormatType = DX.NumericFormat[formatInfo.format.toLowerCase()],
                numberFormat = Globalize.culture().numberFormat,
                currencyFormat = formatInfo.currencyCulture && Globalize.cultures[formatInfo.currencyCulture] ? Globalize.cultures[formatInfo.currencyCulture].numberFormat.currency : numberFormat.currency,
                percentFormat = numberFormat.percent,
                formatSettings = self._getUnitFormatSettings(value, formatInfo),
                unit = formatSettings.unit,
                precision = formatSettings.precision,
                showTrailingZeros = formatSettings.showTrailingZeros,
                includeGroupSeparator = formatSettings.includeGroupSeparator,
                groupSymbol = numberFormat[","],
                floatingSymbol = numberFormat["."],
                number,
                isNegative,
                pattern,
                currentFormat,
                regexParts = /n|\$|-|%/g,
                result = "";
            value = self._applyUnitToValue(value, unit);
            number = Math.abs(value);
            isNegative = value < 0;
            switch (numericFormatType) {
                case"D":
                    pattern = "n";
                    number = Math[isNegative ? "ceil" : "floor"](number);
                    if (precision > 0) {
                        var str = "" + number;
                        for (var i = str.length; i < precision; i += 1)
                            str = "0" + str;
                        number = str
                    }
                    if (isNegative)
                        number = "-" + number;
                    break;
                case"N":
                    currentFormat = numberFormat;
                case"C":
                    currentFormat = currentFormat || currencyFormat;
                case"P":
                    currentFormat = currentFormat || percentFormat;
                    pattern = isNegative ? currentFormat.pattern[0] : currentFormat.pattern[1] || "n";
                    number = Globalize.format(number * (numericFormatType === "P" ? 100 : 1), "N" + precision);
                    if (!showTrailingZeros)
                        number = self._excludeTrailingZeros(number, floatingSymbol);
                    if (!includeGroupSeparator)
                        number = number.replace(new RegExp('\\' + groupSymbol, 'g'), '');
                    break;
                default:
                    throw"Illegal numeric format: '" + numericFormatType + "'";
            }
            for (; ; ) {
                var lastIndex = regexParts.lastIndex,
                    matches = regexParts.exec(pattern);
                result += pattern.slice(lastIndex, matches ? matches.index : pattern.length);
                if (matches)
                    switch (matches[0]) {
                        case"-":
                            if (/[1-9]/.test(number))
                                result += numberFormat["-"];
                            break;
                        case"$":
                            result += currencyFormat.symbol;
                            break;
                        case"%":
                            result += percentFormat.symbol;
                            break;
                        case"n":
                            result += number + unit;
                            break
                    }
                else
                    break
            }
            return (formatInfo.plus && value > 0 ? "+" : '') + result
        },
        _excludeTrailingZeros: function(strValue, floatingSymbol) {
            var floatingIndex = strValue.indexOf(floatingSymbol),
                stopIndex,
                i;
            if (floatingIndex < 0)
                return strValue;
            stopIndex = strValue.length;
            for (i = stopIndex - 1; i >= floatingIndex && (strValue[i] === '0' || i === floatingIndex); i--)
                stopIndex--;
            return strValue.substring(0, stopIndex)
        },
        _getUnitFormatSettings: function(value, formatInfo) {
            var unit = formatInfo.unit || '',
                precision = formatInfo.precision || 0,
                includeGroupSeparator = formatInfo.includeGroupSeparator || false,
                showTrailingZeros = true,
                significantDigits = formatInfo.significantDigits || 1,
                absValue;
            if (unit.toLowerCase() === 'auto') {
                showTrailingZeros = false;
                absValue = Math.abs(value);
                if (significantDigits < 1)
                    significantDigits = 1;
                if (absValue >= 1000000000) {
                    unit = 'B';
                    absValue /= 1000000000
                }
                else if (absValue >= 1000000) {
                    unit = 'M';
                    absValue /= 1000000
                }
                else if (absValue >= 1000) {
                    unit = 'K';
                    absValue /= 1000
                }
                else
                    unit = '';
                if (absValue == 0)
                    precision = 0;
                else if (absValue < 1) {
                    precision = significantDigits;
                    var smallValue = Math.pow(10, -significantDigits);
                    while (absValue < smallValue) {
                        smallValue /= 10;
                        precision++
                    }
                }
                else if (absValue >= 100)
                    precision = significantDigits - 3;
                else if (absValue >= 10)
                    precision = significantDigits - 2;
                else
                    precision = significantDigits - 1
            }
            if (precision < 0)
                precision = 0;
            return {
                    unit: unit,
                    precision: precision,
                    showTrailingZeros: showTrailingZeros,
                    includeGroupSeparator: includeGroupSeparator
                }
        },
        _applyUnitToValue: function(value, unit) {
            if (unit == 'B')
                return value.toFixed(1) / 1000000000;
            if (unit == 'M')
                return value / 1000000;
            if (unit == 'K')
                return value / 1000;
            return value
        },
        _formatDateEx: function(value, formatInfo) {
            var self = this,
                quarterPrefix = 'Q',
                format = formatInfo.format,
                dateType = formatInfo.dateType,
                calendar = Globalize.culture().calendars.standard,
                time = undefined,
                index,
                dateStr;
            format = format.toLowerCase();
            if (dateType !== 'num' || format === 'dayofweek')
                switch (format) {
                    case'monthyear':
                        return self._formatDate(value, 'monthandyear');
                    case'quarteryear':
                        return self.getQuarterString(value, 'QQ') + ' ' + value.getFullYear();
                    case'daymonthyear':
                        return self._formatDate(value, dateType + 'Date');
                    case'datehour':
                        time = new Date(value.getTime());
                        time.setMinutes(0);
                        dateStr = self._formatDate(value, dateType + 'Date');
                        return dateStr + ' ' + self._formatDate(time, 'shorttime');
                    case'datehourminute':
                        dateStr = self._formatDate(value, dateType + 'Date');
                        return dateStr + ' ' + self._formatDate(value, 'shorttime');
                    case'datehourminutesecond':
                        dateStr = self._formatDate(value, dateType + 'Date');
                        return dateStr + ' ' + self._formatDate(value, 'longtime');
                    case'year':
                        dateStr = value.toString();
                        return dateType === 'abbr' ? dateStr.slice(2, 4) : dateStr;
                    case'quarter':
                        return quarterPrefix + value.toString();
                    case'month':
                        index = value - 1;
                        return dateType === 'abbr' ? calendar.months.namesAbbr[index] : calendar.months.names[index];
                    case'hour':
                        if (dateType === 'long') {
                            time = new Date;
                            time.setHours(value);
                            time.setMinutes(0);
                            return self._formatDate(time, 'shorttime')
                        }
                        else
                            return value.toString();
                    case'dayofweek':
                        index = $.inArray(value, ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
                        if (dateType !== 'num')
                            return dateType === 'abbr' ? calendar.days.namesAbbr[index] : calendar.days.names[index];
                        else
                            return ((index - calendar.firstDay + 1 + 7) % 8).toString();
                    default:
                        return value.toString()
                }
            else
                return value.toString()
        },
        getTimeFormat: function(showSecond) {
            if (showSecond)
                return this._getDateTimeFormatPattern('longtime');
            return this._getDateTimeFormatPattern('shorttime')
        },
        getDateFormatByDifferences: function(dateDifferences) {
            var resultFormat = '';
            if (dateDifferences.millisecond)
                resultFormat = DX.DateTimeFormat.millisecond;
            if (dateDifferences.hour || dateDifferences.minute || dateDifferences.second)
                resultFormat = this._addFormatSeparator(this.getTimeFormat(dateDifferences.second), resultFormat);
            if (dateDifferences.year && dateDifferences.month && dateDifferences.day)
                return this._addFormatSeparator(this._getDateTimeFormatPattern('shortdate'), resultFormat);
            if (dateDifferences.year && dateDifferences.month)
                return DX.DateTimeFormat['monthandyear'];
            if (dateDifferences.year)
                return DX.DateTimeFormat['year'];
            if (dateDifferences.month && dateDifferences.day)
                return this._addFormatSeparator(this._getDateTimeFormatPattern('monthandday'), resultFormat);
            if (dateDifferences.month)
                return DX.DateTimeFormat['month'];
            if (dateDifferences.day)
                return this._addFormatSeparator('dddd, dd', resultFormat);
            return resultFormat
        },
        getDateFormatByTicks: function(ticks) {
            var resultFormat,
                maxDif,
                currentDif,
                i,
                dateUnitInterval;
            if (ticks.length > 1) {
                maxDif = utils.getDatesDifferences(ticks[0], ticks[1]);
                for (i = 1; i < ticks.length - 1; i++) {
                    currentDif = utils.getDatesDifferences(ticks[i], ticks[i + 1]);
                    if (maxDif.count < currentDif.count)
                        maxDif = currentDif
                }
            }
            else
                maxDif = {
                    year: true,
                    month: true,
                    day: true,
                    hour: ticks[0].getHours() > 0,
                    minute: ticks[0].getMinutes() > 0,
                    second: ticks[0].getSeconds() > 0
                };
            resultFormat = this.getDateFormatByDifferences(maxDif);
            return resultFormat
        },
        getDateFormatByTickInterval: function(startValue, endValue, tickInterval) {
            var resultFormat,
                dateDifferences,
                dateUnitInterval,
                dateDifferencesConverter = {
                    quarter: 'month',
                    week: 'day'
                },
                correctDateDifferences = function(dateDifferences, tickInterval, value) {
                    switch (tickInterval) {
                        case'year':
                            dateDifferences.month = value;
                        case'quarter':
                        case'month':
                            dateDifferences.day = value;
                        case'week':
                        case'day':
                            dateDifferences.hour = value;
                        case'hour':
                            dateDifferences.minute = value;
                        case'minute':
                            dateDifferences.second = value;
                        case'second':
                            dateDifferences.millisecond = value
                    }
                },
                correctDifferencesByMaxDate = function(differences, minDate, maxDate) {
                    if (!maxDate.getMilliseconds() && maxDate.getSeconds()) {
                        if (maxDate.getSeconds() - minDate.getSeconds() === 1) {
                            differences.millisecond = true;
                            differences.second = false
                        }
                    }
                    else if (!maxDate.getSeconds() && maxDate.getMinutes()) {
                        if (maxDate.getMinutes() - minDate.getMinutes() === 1) {
                            differences.second = true;
                            differences.minute = false
                        }
                    }
                    else if (!maxDate.getMinutes() && maxDate.getHours()) {
                        if (maxDate.getHours() - minDate.getHours() === 1) {
                            differences.minute = true;
                            differences.hour = false
                        }
                    }
                    else if (!maxDate.getHours() && maxDate.getDate() > 1) {
                        if (maxDate.getDate() - minDate.getDate() === 1) {
                            differences.hour = true;
                            differences.day = false
                        }
                    }
                    else if (maxDate.getDate() === 1 && maxDate.getMonth()) {
                        if (maxDate.getMonth() - minDate.getMonth() === 1) {
                            differences.day = true;
                            differences.month = false
                        }
                    }
                    else if (!maxDate.getMonth() && maxDate.getFullYear())
                        if (maxDate.getFullYear() - minDate.getFullYear() === 1) {
                            differences.month = true;
                            differences.year = false
                        }
                };
            tickInterval = utils.isString(tickInterval) ? tickInterval.toLowerCase() : tickInterval;
            dateDifferences = utils.getDatesDifferences(startValue, endValue);
            if (startValue !== endValue)
                correctDifferencesByMaxDate(dateDifferences, startValue > endValue ? endValue : startValue, startValue > endValue ? startValue : endValue);
            dateUnitInterval = utils.getDateUnitInterval(dateDifferences);
            correctDateDifferences(dateDifferences, dateUnitInterval, true);
            dateUnitInterval = utils.getDateUnitInterval(tickInterval || 'second');
            correctDateDifferences(dateDifferences, dateUnitInterval, false);
            dateDifferences[dateDifferencesConverter[dateUnitInterval] || dateUnitInterval] = true;
            resultFormat = this.getDateFormatByDifferences(dateDifferences);
            return resultFormat
        }
    }
})(jQuery, DevExpress);

// Module core, file data.js

(function($, DX, undefined) {
    var HAS_KO = !!window.ko;
    var bracketsToDots = function(expr) {
            return expr.replace(/\[/g, ".").replace(/\]/g, "")
        };
    var unwrapObservable = function(value) {
            if (HAS_KO)
                return ko.utils.unwrapObservable(value);
            return value
        };
    var isObservable = function(value) {
            return HAS_KO && ko.isObservable(value)
        };
    var assign = function(obj, propName, value) {
            var propValue = obj[propName];
            if (isObservable(propValue))
                propValue(value);
            else
                obj[propName] = value
        };
    var compileGetter = function(expr) {
            if (arguments.length > 1)
                expr = $.makeArray(arguments);
            if (!expr || expr === "this")
                return function(obj) {
                        return obj
                    };
            if ($.isFunction(expr))
                return expr;
            if ($.isArray(expr))
                return combineGetters(expr);
            expr = bracketsToDots(expr);
            var path = expr.split(".");
            return function(obj, options) {
                    options = options || {};
                    var current = unwrapObservable(obj);
                    $.each(path, function() {
                        if (!current)
                            return false;
                        var next = unwrapObservable(current[this]);
                        if ($.isFunction(next) && !options.functionsAsIs)
                            next = next.call(current);
                        current = next
                    });
                    return current
                }
        };
    var combineGetters = function(getters) {
            var compiledGetters = {};
            $.each(getters, function() {
                compiledGetters[this] = compileGetter(this)
            });
            return function(obj) {
                    var result = {};
                    $.each(compiledGetters, function(name) {
                        var value = this(obj),
                            current,
                            path,
                            last,
                            i;
                        if (value === undefined)
                            return;
                        current = result;
                        path = name.split(".");
                        last = path.length - 1;
                        for (i = 0; i < last; i++)
                            current = current[path[i]] = {};
                        current[path[i]] = value
                    });
                    return result
                }
        };
    var compileSetter = function(expr) {
            if (!expr || expr === "this")
                throw Error("Cannot assign to self");
            expr = bracketsToDots(expr);
            var pos = expr.lastIndexOf("."),
                targetGetter = compileGetter(expr.substr(0, pos)),
                targetExpr = expr.substr(1 + pos);
            return function(obj, value, options) {
                    options = options || {};
                    var target = targetGetter(obj, {functionsAsIs: options.functionsAsIs}),
                        prevTargetValue = target[targetExpr];
                    if (!options.functionsAsIs && $.isFunction(prevTargetValue) && !isObservable(prevTargetValue))
                        target[targetExpr](value);
                    else {
                        prevTargetValue = unwrapObservable(prevTargetValue);
                        if (options.merge && $.isPlainObject(value) && (prevTargetValue === undefined || $.isPlainObject(prevTargetValue))) {
                            if (!prevTargetValue)
                                assign(target, targetExpr, {});
                            $.extend(true, unwrapObservable(target[targetExpr]), value)
                        }
                        else
                            assign(target, targetExpr, value)
                    }
                }
        };
    var normalizeBinaryCriterion = function(crit) {
            return [crit[0], crit.length < 3 ? "=" : crit[1].toLowerCase(), crit.length < 2 ? true : crit[crit.length - 1]]
        };
    var normalizeSortingInfo = function(info) {
            if (!$.isArray(info))
                info = [info];
            return $.map(info, function(i) {
                    return {
                            selector: $.isFunction(i) || typeof i === "string" ? i : i.field || i.selector,
                            desc: !!(i.desc || String(i.dir).charAt(0).toLowerCase() === "d")
                        }
                })
        };
    var Guid = DX.Class.inherit({
            ctor: function(value) {
                if (value)
                    value = String(value);
                this._value = this._normalize(value || this._generate())
            },
            _normalize: function(value) {
                value = value.replace(/[^a-f0-9]/ig, "").toLowerCase();
                while (value.length < 32)
                    value += "0";
                return [value.substr(0, 8), value.substr(8, 4), value.substr(12, 4), value.substr(16, 4), value.substr(20)].join("-")
            },
            _generate: function() {
                var value = "";
                for (var i = 0; i < 32; i++)
                    value += Math.round(Math.random() * 16).toString(16);
                return value
            },
            toString: function() {
                return this._value
            },
            valueOf: function() {
                return this._value
            },
            toJSON: function() {
                return this._value
            }
        });
    var toComparable = function(value, caseSensitive) {
            if (value instanceof Date)
                return value.getTime();
            if (value instanceof Guid)
                return value.valueOf();
            if (!caseSensitive && typeof value === "string")
                return value.toLowerCase();
            return value
        };
    var keysEqual = function(keyExpr, key1, key2) {
            if ($.isArray(keyExpr)) {
                var names = $.map(key1, function(v, k) {
                        return k
                    }),
                    name;
                for (var i = 0; i < names.length; i++) {
                    name = names[i];
                    if (toComparable(key1[name], true) != toComparable(key2[name], true))
                        return false
                }
                return true
            }
            return toComparable(key1, true) == toComparable(key2, true)
        };
    var BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var base64_encode = function(input) {
            if (!$.isArray(input))
                input = stringToByteArray(String(input));
            var result = "";
            for (var i = 0; i < input.length; i += 3) {
                var octet1 = input[i],
                    octet2 = input[i + 1],
                    octet3 = input[i + 2];
                result += $.map([octet1 >> 2, (octet1 & 3) << 4 | octet2 >> 4, isNaN(octet2) ? 64 : (octet2 & 15) << 2 | octet3 >> 6, isNaN(octet3) ? 64 : octet3 & 63], function(item) {
                    return BASE64_CHARS.charAt(item)
                }).join("")
            }
            return result
        };
    var stringToByteArray = function(str) {
            var bytes = [],
                code,
                i;
            for (i = 0; i < str.length; i++) {
                code = str.charCodeAt(i);
                if (code < 128)
                    bytes.push(code);
                else if (code < 2048)
                    bytes.push(192 + (code >> 6), 128 + (code & 63));
                else if (code < 65536)
                    bytes.push(224 + (code >> 12), 128 + (code >> 6 & 63), 128 + (code & 63));
                else if (code < 2097152)
                    bytes.push(240 + (code >> 18), 128 + (code >> 12 & 63), 128 + (code >> 6 & 63), 128 + (code & 63))
            }
            return bytes
        };
    var errorMessageFromXhr = function() {
            var textStatusMessages = {
                    timeout: "Network connection timeout",
                    error: "Unspecified network error",
                    parsererror: "Unexpected server response"
                };
            var textStatusDetails = {
                    timeout: "possible causes: the remote host is not accessible, overloaded or is not included into the domain white-list when being run in the native container",
                    error: "if the remote host is located on another domain, make sure it properly supports cross-origin resource sharing (CORS), or use the JSONP approach instead",
                    parsererror: "the remote host did not respond with valid JSON data"
                };
            var explainTextStatus = function(textStatus) {
                    var result = textStatusMessages[textStatus];
                    if (!result)
                        return textStatus;
                    result += " (" + textStatusDetails[textStatus] + ")";
                    return result
                };
            return function(xhr, textStatus) {
                    if (xhr.status < 400)
                        return explainTextStatus(textStatus);
                    return xhr.statusText
                }
        }();
    var data = DX.data = {
            utils: {
                compileGetter: compileGetter,
                compileSetter: compileSetter,
                normalizeBinaryCriterion: normalizeBinaryCriterion,
                normalizeSortingInfo: normalizeSortingInfo,
                toComparable: toComparable,
                keysEqual: keysEqual,
                errorMessageFromXhr: errorMessageFromXhr
            },
            Guid: Guid,
            base64_encode: base64_encode,
            queryImpl: {},
            queryAdapters: {},
            query: function() {
                var impl = $.isArray(arguments[0]) ? "array" : "remote";
                return data.queryImpl[impl].apply(this, arguments)
            },
            errorHandler: null,
            _handleError: function(error) {
                if (window.console)
                    console.warn("[DevExpress.data]: " + error);
                if (data.errorHandler)
                    data.errorHandler(error)
            }
        }
})(jQuery, DevExpress);

// Module core, file data.query.array.js

(function($, DX, undefined) {
    var Class = DX.Class,
        data = DX.data,
        queryImpl = data.queryImpl,
        compileGetter = data.utils.compileGetter,
        toComparable = data.utils.toComparable;
    var Iterator = Class.inherit({
            toArray: function() {
                var result = [];
                this.reset();
                while (this.next())
                    result.push(this.current());
                return result
            },
            countable: function() {
                return false
            }
        });
    var ArrayIterator = Iterator.inherit({
            ctor: function(array) {
                this.array = array;
                this.index = -1
            },
            next: function() {
                if (this.index + 1 < this.array.length) {
                    this.index++;
                    return true
                }
                return false
            },
            current: function() {
                return this.array[this.index]
            },
            reset: function() {
                this.index = -1
            },
            toArray: function() {
                return this.array.slice(0)
            },
            countable: function() {
                return true
            },
            count: function() {
                return this.array.length
            }
        });
    var WrappedIterator = Iterator.inherit({
            ctor: function(iter) {
                this.iter = iter
            },
            next: function() {
                return this.iter.next()
            },
            current: function() {
                return this.iter.current()
            },
            reset: function() {
                return this.iter.reset()
            }
        });
    var SortIterator = Iterator.inherit({
            ctor: function(iter, getter, desc) {
                this.iter = iter;
                this.rules = [{
                        getter: getter,
                        desc: desc
                    }]
            },
            thenBy: function(getter, desc) {
                var result = new SortIterator(this.sortedIter || this.iter, getter, desc);
                if (!this.sortedIter)
                    result.rules = this.rules.concat(result.rules);
                return result
            },
            next: function() {
                this._ensureSorted();
                return this.sortedIter.next()
            },
            current: function() {
                this._ensureSorted();
                return this.sortedIter.current()
            },
            reset: function() {
                delete this.sortedIter
            },
            countable: function() {
                return this.sortedIter || this.iter.countable()
            },
            count: function() {
                if (this.sortedIter)
                    return this.sortedIter.count();
                return this.iter.count()
            },
            _ensureSorted: function() {
                if (this.sortedIter)
                    return;
                $.each(this.rules, function() {
                    this.getter = compileGetter(this.getter)
                });
                this.sortedIter = new ArrayIterator(this.iter.toArray().sort($.proxy(this._compare, this)))
            },
            _compare: function(x, y) {
                if (x === y)
                    return 0;
                for (var i = 0, rulesCount = this.rules.length; i < rulesCount; i++) {
                    var rule = this.rules[i],
                        xValue = toComparable(rule.getter(x)),
                        yValue = toComparable(rule.getter(y)),
                        factor = rule.desc ? -1 : 1;
                    if (xValue < yValue)
                        return -factor;
                    if (xValue > yValue)
                        return factor;
                    if (xValue !== yValue)
                        return !xValue ? -factor : factor
                }
                return 0
            }
        });
    var compileCriteria = function() {
            var compileGroup = function(crit) {
                    var operands = [],
                        bag = ["return function(d) { return "],
                        index = 0,
                        pushAnd = false;
                    $.each(crit, function() {
                        if ($.isArray(this) || $.isFunction(this)) {
                            if (pushAnd)
                                bag.push(" && ");
                            operands.push(compileCriteria(this));
                            bag.push("op[", index, "](d)");
                            index++;
                            pushAnd = true
                        }
                        else {
                            bag.push(/and|&/i.test(this) ? " && " : " || ");
                            pushAnd = false
                        }
                    });
                    bag.push(" }");
                    return new Function("op", bag.join(""))(operands)
                };
            var toString = function(value) {
                    return DX.utils.isDefined(value) ? value.toString() : ''
                };
            var compileBinary = function(crit) {
                    crit = data.utils.normalizeBinaryCriterion(crit);
                    var getter = compileGetter(crit[0]),
                        op = crit[1],
                        value = crit[2];
                    value = toComparable(value);
                    switch (op.toLowerCase()) {
                        case"=":
                            return function(obj) {
                                    return toComparable(getter(obj)) == value
                                };
                        case"<>":
                            return function(obj) {
                                    return toComparable(getter(obj)) != value
                                };
                        case">":
                            return function(obj) {
                                    return toComparable(getter(obj)) > value
                                };
                        case"<":
                            return function(obj) {
                                    return toComparable(getter(obj)) < value
                                };
                        case">=":
                            return function(obj) {
                                    return toComparable(getter(obj)) >= value
                                };
                        case"<=":
                            return function(obj) {
                                    return toComparable(getter(obj)) <= value
                                };
                        case"startswith":
                            return function(obj) {
                                    return toComparable(toString(getter(obj))).indexOf(value) === 0
                                };
                        case"endswith":
                            return function(obj) {
                                    var getterValue = toComparable(toString(getter(obj)));
                                    return getterValue.lastIndexOf(value) === getterValue.length - toString(value).length
                                };
                        case"contains":
                            return function(obj) {
                                    return toComparable(toString(getter(obj))).indexOf(value) > -1
                                };
                        case"notcontains":
                            return function(obj) {
                                    return toComparable(toString(getter(obj))).indexOf(value) === -1
                                }
                    }
                };
            return function(crit) {
                    if ($.isFunction(crit))
                        return crit;
                    if ($.isArray(crit[0]))
                        return compileGroup(crit);
                    return compileBinary(crit)
                }
        }();
    var FilterIterator = WrappedIterator.inherit({
            ctor: function(iter, criteria) {
                this.callBase(iter);
                this.criteria = compileCriteria(criteria)
            },
            next: function() {
                while (this.iter.next())
                    if (this.criteria(this.current()))
                        return true;
                return false
            }
        });
    var GroupIterator = Iterator.inherit({
            ctor: function(iter, getter) {
                this.iter = iter;
                this.getter = getter
            },
            next: function() {
                this._ensureGrouped();
                return this.groupedIter.next()
            },
            current: function() {
                this._ensureGrouped();
                return this.groupedIter.current()
            },
            reset: function() {
                delete this.groupedIter
            },
            countable: function() {
                return !!this.groupedIter
            },
            count: function() {
                return this.groupedIter.count()
            },
            _ensureGrouped: function() {
                if (this.groupedIter)
                    return;
                var hash = {},
                    keys = [],
                    iter = this.iter,
                    getter = compileGetter(this.getter);
                iter.reset();
                while (iter.next()) {
                    var current = iter.current(),
                        key = getter(current);
                    if (key in hash)
                        hash[key].push(current);
                    else {
                        hash[key] = [current];
                        keys.push(key)
                    }
                }
                this.groupedIter = new ArrayIterator($.map(keys, function(key) {
                    return {
                            key: key,
                            items: hash[key]
                        }
                }))
            }
        });
    var SelectIterator = WrappedIterator.inherit({
            ctor: function(iter, getter) {
                this.callBase(iter);
                this.getter = compileGetter(getter)
            },
            current: function() {
                return this.getter(this.callBase())
            },
            countable: function() {
                return this.iter.countable()
            },
            count: function() {
                return this.iter.count()
            }
        });
    var SliceIterator = WrappedIterator.inherit({
            ctor: function(iter, skip, take) {
                this.callBase(iter);
                this.skip = Math.max(0, skip);
                this.take = Math.max(0, take);
                this.pos = 0
            },
            next: function() {
                if (this.pos >= this.skip + this.take)
                    return false;
                while (this.pos < this.skip && this.iter.next())
                    this.pos++;
                this.pos++;
                return this.iter.next()
            },
            reset: function() {
                this.callBase();
                this.pos = 0
            },
            countable: function() {
                return this.iter.countable()
            },
            count: function() {
                return Math.min(this.iter.count() - this.skip, this.take)
            }
        });
    queryImpl.array = function(iter, queryOptions) {
        queryOptions = queryOptions || {};
        if (!(iter instanceof Iterator))
            iter = new ArrayIterator(iter);
        var handleError = function(error) {
                var handler = queryOptions.errorHandler;
                if (handler)
                    handler(error);
                data._handleError(error)
            };
        var aggregate = function(seed, step, finalize) {
                var d = $.Deferred().fail(handleError);
                try {
                    iter.reset();
                    if (arguments.length < 2) {
                        step = arguments[0];
                        seed = iter.next() ? iter.current() : undefined
                    }
                    var accumulator = seed;
                    while (iter.next())
                        accumulator = step(accumulator, iter.current());
                    d.resolve(finalize ? finalize(accumulator) : accumulator)
                }
                catch(x) {
                    d.reject(x)
                }
                return d.promise()
            };
        var select = function(getter) {
                if (!$.isFunction(getter) && !$.isArray(getter))
                    getter = $.makeArray(arguments);
                return chainQuery(new SelectIterator(iter, getter))
            };
        var selectProp = function(name) {
                return select(compileGetter(name))
            };
        var chainQuery = function(iter) {
                return queryImpl.array(iter, queryOptions)
            };
        return {
                toArray: function() {
                    return iter.toArray()
                },
                enumerate: function() {
                    var d = $.Deferred().fail(handleError);
                    try {
                        d.resolve(iter.toArray())
                    }
                    catch(x) {
                        d.reject(x)
                    }
                    return d.promise()
                },
                sortBy: function(getter, desc) {
                    return chainQuery(new SortIterator(iter, getter, desc))
                },
                thenBy: function(getter, desc) {
                    if (iter instanceof SortIterator)
                        return chainQuery(iter.thenBy(getter, desc));
                    throw Error();
                },
                filter: function(criteria) {
                    if (!$.isArray(criteria))
                        criteria = $.makeArray(arguments);
                    return chainQuery(new FilterIterator(iter, criteria))
                },
                slice: function(skip, take) {
                    if (take === undefined)
                        take = Number.MAX_VALUE;
                    return chainQuery(new SliceIterator(iter, skip, take))
                },
                select: select,
                groupBy: function(getter, desc) {
                    return chainQuery(new GroupIterator(iter, getter, desc))
                },
                aggregate: aggregate,
                count: function() {
                    if (iter.countable()) {
                        var d = $.Deferred().fail(handleError);
                        try {
                            d.resolve(iter.count())
                        }
                        catch(x) {
                            d.reject(x)
                        }
                        return d.promise()
                    }
                    return aggregate(0, function(count) {
                            return 1 + count
                        })
                },
                sum: function(getter) {
                    if (getter)
                        return selectProp(getter).sum();
                    return aggregate(0, function(sum, item) {
                            return sum + item
                        })
                },
                min: function(getter) {
                    if (getter)
                        return selectProp(getter).min();
                    return aggregate(function(min, item) {
                            return item < min ? item : min
                        })
                },
                max: function(getter) {
                    if (getter)
                        return selectProp(getter).max();
                    return aggregate(function(max, item) {
                            return item > max ? item : max
                        })
                },
                avg: function(getter) {
                    if (getter)
                        return selectProp(getter).avg();
                    var count = 0;
                    return aggregate(0, function(sum, item) {
                            count++;
                            return sum + item
                        }, function(sum) {
                            return count ? sum / count : undefined
                        })
                }
            }
    }
})(jQuery, DevExpress);

// Module core, file data.query.remote.js

(function($, DX, undefined) {
    var data = DX.data,
        queryImpl = data.queryImpl;
    queryImpl.remote = function(url, queryOptions, tasks) {
        tasks = tasks || [];
        queryOptions = queryOptions || {};
        var createTask = function(name, args) {
                return {
                        name: name,
                        args: args
                    }
            };
        var exec = function(executorTask) {
                var d = $.Deferred(),
                    adapterFactory,
                    adapter,
                    taskQueue,
                    currentTask;
                var rejectWithNotify = function(error) {
                        var handler = queryOptions.errorHandler;
                        if (handler)
                            handler(error);
                        data._handleError(error);
                        d.reject(error)
                    };
                try {
                    adapterFactory = queryOptions.adapter || "odata";
                    if (!$.isFunction(adapterFactory))
                        adapterFactory = data.queryAdapters[adapterFactory];
                    adapter = adapterFactory(queryOptions);
                    taskQueue = [].concat(tasks).concat(executorTask);
                    while (taskQueue.length) {
                        currentTask = taskQueue[0];
                        if (String(currentTask.name) !== "enumerate")
                            if (!adapter[currentTask.name] || adapter[currentTask.name].apply(adapter, currentTask.args) === false)
                                break;
                        taskQueue.shift()
                    }
                    adapter.exec(url).done(function(result) {
                        if (!taskQueue.length)
                            d.resolve(result);
                        else {
                            var clientChain = queryImpl.array(result, {errorHandler: queryOptions.errorHandler});
                            $.each(taskQueue, function() {
                                clientChain = clientChain[this.name].apply(clientChain, this.args)
                            });
                            clientChain.done($.proxy(d.resolve, d)).fail($.proxy(d.reject, d))
                        }
                    }).fail(rejectWithNotify)
                }
                catch(x) {
                    rejectWithNotify(x)
                }
                return d.promise()
            };
        var query = {};
        $.each(["sortBy", "thenBy", "filter", "slice", "select", "groupBy"], function() {
            var name = this;
            query[name] = function() {
                return queryImpl.remote(url, queryOptions, tasks.concat(createTask(name, arguments)))
            }
        });
        $.each(["count", "min", "max", "sum", "avg", "aggregate", "enumerate"], function() {
            var name = this;
            query[name] = function() {
                return exec.call(this, createTask(name, arguments))
            }
        });
        return query
    }
})(jQuery, DevExpress);

// Module core, file data.odata.js

(function($, DX, undefined) {
    var data = DX.data,
        Guid = data.Guid;
    var JSON_MIME_TYPE = "application/json;odata=verbose";
    var TEXT_MIME_TYPE = "text/plain";
    var ajaxOptionsForRequest = function(request, requestOptions) {
            request = $.extend({
                method: "get",
                url: "",
                params: {},
                payload: null,
                headers: {Accept: [JSON_MIME_TYPE, TEXT_MIME_TYPE].join()}
            }, request);
            requestOptions = requestOptions || {};
            var beforeSend = requestOptions.beforeSend;
            if (beforeSend)
                beforeSend(request);
            var method = (request.method || "get").toLowerCase(),
                isGet = method === "get",
                useJsonp = isGet && requestOptions.jsonp,
                params = $.extend({}, request.params),
                ajaxData = isGet ? params : JSON.stringify(request.payload),
                qs = !isGet && $.param(params),
                url = request.url,
                contentType = !isGet && JSON_MIME_TYPE;
            if (qs)
                url += (url.indexOf("?") > -1 ? "&" : "?") + qs;
            if (useJsonp)
                ajaxData["$format"] = "json";
            return {
                    url: url,
                    data: ajaxData,
                    dataType: useJsonp ? "jsonp" : "json",
                    jsonp: useJsonp && "$callback",
                    type: method,
                    timeout: 30000,
                    headers: request.headers,
                    contentType: contentType,
                    xhrFields: {withCredentials: true}
                }
        };
    var sendRequest = function(request, requestOptions) {
            var d = $.Deferred();
            $.ajax(ajaxOptionsForRequest(request, requestOptions)).always(function(obj, textStatus) {
                var tuplet = interpretVerboseJsonFormat(obj, textStatus),
                    error = tuplet.error,
                    data = tuplet.data,
                    nextUrl = tuplet.nextUrl;
                if (error)
                    d.reject(error);
                else if (requestOptions.countOnly)
                    d.resolve(tuplet.count);
                else if (nextUrl)
                    sendRequest({url: nextUrl}, requestOptions).fail($.proxy(d.reject, d)).done(function(nextData) {
                        d.resolve(data.concat(nextData))
                    });
                else
                    d.resolve(data)
            });
            return d.promise()
        };
    var formatDotNetError = function(errorObj) {
            var message,
                currentError = errorObj;
            if ("message" in errorObj)
                if (errorObj.message.value)
                    message = errorObj.message.value;
                else
                    message = errorObj.message;
            while (currentError = currentError.innererror || currentError.internalexception) {
                message = currentError.message;
                if (currentError.internalexception && message.indexOf("inner exception") === -1)
                    break
            }
            return message
        };
    var errorFromResponse = function(obj, textStatus) {
            if (textStatus === "nocontent")
                return null;
            var httpStatus = 200,
                message = "Unknown error",
                innerError,
                response = obj;
            if (textStatus !== "success") {
                httpStatus = obj.status;
                message = data.utils.errorMessageFromXhr(obj, textStatus);
                try {
                    response = $.parseJSON(obj.responseText)
                }
                catch(x) {}
            }
            var errorObj = response && response.error;
            if (errorObj) {
                message = formatDotNetError(errorObj) || message;
                if (httpStatus === 200)
                    httpStatus = 500;
                if (response.error.code)
                    httpStatus = Number(response.error.code);
                return $.extend(Error(message), {
                        httpStatus: httpStatus,
                        errorDetails: errorObj
                    })
            }
            else if (httpStatus !== 200)
                return $.extend(Error(message), {httpStatus: httpStatus})
        };
    var interpretVerboseJsonFormat = function(obj, textStatus) {
            var error = errorFromResponse(obj, textStatus);
            if (error)
                return {error: error};
            if (!$.isPlainObject(obj))
                return {data: obj};
            var data = obj.d;
            if (!data)
                return {error: Error("Malformed or unsupported JSON response received")};
            data = data.results || data;
            recognizeDates(data);
            return {
                    data: data,
                    nextUrl: obj.d.__next,
                    count: obj.d.__count
                }
        };
    var EdmLiteral = DX.Class.inherit({
            ctor: function(value) {
                this._value = value
            },
            valueOf: function() {
                return this._value
            }
        });
    var serializeDate = function() {
            var pad = function(part) {
                    part = String(part);
                    if (part.length < 2)
                        part = "0" + part;
                    return part
                };
            return function(date) {
                    var result = ["datetime'", date.getUTCFullYear(), "-", pad(date.getUTCMonth() + 1), "-", pad(date.getUTCDate())];
                    if (date.getUTCHours() || date.getUTCMinutes() || date.getUTCSeconds() || date.getUTCMilliseconds()) {
                        result.push("T", pad(date.getUTCHours()), ":", pad(date.getUTCMinutes()), ":", pad(date.getUTCSeconds()));
                        if (date.getUTCMilliseconds())
                            result.push(".", date.getUTCMilliseconds())
                    }
                    result.push("'");
                    return result.join("")
                }
        }();
    var serializePropName = function(propName) {
            return propName.replace(/\./g, "/")
        };
    var serializeValue = function(value) {
            if (value instanceof Date)
                return serializeDate(value);
            if (value instanceof Guid)
                return "guid'" + value + "'";
            if (value instanceof EdmLiteral)
                return value.valueOf();
            if (typeof value === "string")
                return "'" + value.replace(/'/g, "''") + "'";
            return String(value)
        };
    var serializeKey = function(key) {
            if ($.isPlainObject(key)) {
                var parts = [];
                $.each(key, function(k, v) {
                    parts.push(serializePropName(k) + "=" + serializeValue(v))
                });
                return parts.join()
            }
            return serializeValue(key)
        };
    var recognizeDates = function(list) {
            $.each(list, function(i, val) {
                if (val !== null && typeof val === "object")
                    recognizeDates(val);
                else if (typeof val === "string") {
                    var matches = val.match(/^\/Date\((-?\d+)((\+|-)?(\d+)?)\)\/$/);
                    if (matches)
                        list[i] = new Date(Number(matches[1]) + matches[2] * 60000)
                }
            })
        };
    var keyConverters = {
            String: function(value) {
                return value + ""
            },
            Int32: function(value) {
                return ~~value
            },
            Int64: function(value) {
                if (value instanceof EdmLiteral)
                    return value;
                return new EdmLiteral(value + "L")
            },
            Guid: function(value) {
                if (value instanceof Guid)
                    return value;
                return new Guid(value)
            }
        };
    var compileCriteria = function() {
            var createBinaryOperationFormatter = function(op) {
                    return function(prop, val, bag) {
                            bag.push(prop, " ", op, " ", val)
                        }
                };
            var createStringFuncFormatter = function(op, reverse) {
                    return function(prop, val, bag) {
                            if (reverse)
                                bag.push(op, "(", val, ",", prop, ")");
                            else
                                bag.push(op, "(", prop, ",", val, ")")
                        }
                };
            var formatters = {
                    "=": createBinaryOperationFormatter("eq"),
                    "<>": createBinaryOperationFormatter("ne"),
                    ">": createBinaryOperationFormatter("gt"),
                    ">=": createBinaryOperationFormatter("ge"),
                    "<": createBinaryOperationFormatter("lt"),
                    "<=": createBinaryOperationFormatter("le"),
                    startswith: createStringFuncFormatter("startswith"),
                    endswith: createStringFuncFormatter("endswith"),
                    contains: createStringFuncFormatter("substringof", true),
                    notcontains: createStringFuncFormatter("not substringof", true)
                };
            var compileBinary = function(criteria, bag) {
                    criteria = data.utils.normalizeBinaryCriterion(criteria);
                    formatters[criteria[1]](serializePropName(criteria[0]), serializeValue(criteria[2]), bag)
                };
            var compileGroup = function(criteria, bag) {
                    var pushAnd = false;
                    $.each(criteria, function() {
                        if ($.isArray(this)) {
                            if (pushAnd)
                                bag.push(" and ");
                            bag.push("(");
                            compileCore(this, bag);
                            bag.push(")");
                            pushAnd = true
                        }
                        else {
                            bag.push(/and|&/i.test(this) ? " and " : " or ");
                            pushAnd = false
                        }
                    })
                };
            var compileCore = function(criteria, bag) {
                    if ($.isArray(criteria[0]))
                        compileGroup(criteria, bag);
                    else
                        compileBinary(criteria, bag)
                };
            return function(criteria) {
                    var bag = [];
                    compileCore(criteria, bag);
                    return bag.join("")
                }
        }();
    var createODataQueryAdapter = function(queryOptions) {
            var sorting = [],
                criteria = [],
                select,
                skip,
                take,
                countQuery;
            var hasSlice = function() {
                    return skip || take !== undefined
                };
            var sortCore = function(getter, desc, reset) {
                    if (hasSlice() || typeof getter !== "string")
                        return false;
                    if (reset)
                        sorting = [];
                    var rule = serializePropName(getter);
                    if (desc)
                        rule += " desc";
                    sorting.push(rule)
                };
            var generateExpand = function() {
                    var hash = {};
                    if (queryOptions.expand)
                        $.each($.makeArray(queryOptions.expand), function() {
                            hash[serializePropName(this)] = 1
                        });
                    if (select)
                        $.each(select, function() {
                            var path = this.split(".");
                            if (path.length < 2)
                                return;
                            path.pop();
                            hash[serializePropName(path.join("."))] = 1
                        });
                    return $.map(hash, function(k, v) {
                            return v
                        }).join() || undefined
                };
            var requestData = function() {
                    var result = {};
                    if (!countQuery) {
                        if (sorting.length)
                            result["$orderby"] = sorting.join(",");
                        if (skip)
                            result["$skip"] = skip;
                        if (take !== undefined)
                            result["$top"] = take;
                        if (select)
                            result["$select"] = serializePropName(select.join());
                        result["$expand"] = generateExpand()
                    }
                    if (criteria.length)
                        result["$filter"] = compileCriteria(criteria.length < 2 ? criteria[0] : criteria);
                    if (countQuery) {
                        result["$inlinecount"] = "allpages";
                        result["$top"] = 0
                    }
                    return result
                };
            return {
                    exec: function(url) {
                        return sendRequest({
                                url: url,
                                params: $.extend(requestData(), queryOptions && queryOptions.params)
                            }, {
                                beforeSend: queryOptions.beforeSend,
                                jsonp: queryOptions.jsonp,
                                countOnly: countQuery
                            })
                    },
                    sortBy: function(getter, desc) {
                        return sortCore(getter, desc, true)
                    },
                    thenBy: function(getter, desc) {
                        return sortCore(getter, desc, false)
                    },
                    slice: function(skipCount, takeCount) {
                        if (hasSlice())
                            return false;
                        skip = skipCount;
                        take = takeCount
                    },
                    filter: function(criterion) {
                        if (hasSlice() || $.isFunction(criterion))
                            return false;
                        if (!$.isArray(criterion))
                            criterion = $.makeArray(arguments);
                        if (criteria.length)
                            criteria.push("and");
                        criteria.push(criterion)
                    },
                    select: function(expr) {
                        if (select || $.isFunction(expr))
                            return false;
                        if (!$.isArray(expr))
                            expr = $.makeArray(arguments);
                        select = expr
                    },
                    count: function() {
                        countQuery = true
                    }
                }
        };
    $.extend(true, data, {
        EdmLiteral: EdmLiteral,
        utils: {odata: {
                sendRequest: sendRequest,
                serializePropName: serializePropName,
                serializeValue: serializeValue,
                serializeKey: serializeKey,
                keyConverters: keyConverters
            }},
        queryAdapters: {odata: createODataQueryAdapter}
    })
})(jQuery, DevExpress);

// Module core, file data.store.abstract.js

(function($, DX, undefined) {
    var Class = DX.Class,
        abstract = DX.abstract,
        data = DX.data,
        normalizeSortingInfo = data.utils.normalizeSortingInfo;
    var STORE_CALLBACK_NAMES = ["loading", "loaded", "modifying", "modified", "inserting", "inserted", "updating", "updated", "removing", "removed"];
    var multiLevelGroup = function(query, groupInfo) {
            query = query.groupBy(groupInfo[0].selector);
            if (groupInfo.length > 1)
                query = query.select(function(g) {
                    return $.extend({}, g, {items: multiLevelGroup(data.query(g.items), groupInfo.slice(1)).toArray()})
                });
            return query
        };
    data.Store = Class.inherit({
        ctor: function(options) {
            var self = this;
            options = options || {};
            $.each(STORE_CALLBACK_NAMES, function() {
                var callbacks = self[this] = $.Callbacks();
                if (this in options)
                    callbacks.add(options[this])
            });
            this._key = options.key;
            this._keyGetter = data.utils.compileGetter(this._key);
            this._errorHandler = options.errorHandler
        },
        customLoadOptions: function() {
            return null
        },
        key: function() {
            return this._key
        },
        keyOf: function(obj) {
            return this._keyGetter(obj)
        },
        _requireKey: function() {
            if (!this._key)
                throw Error("Key expression is required for this operation");
        },
        load: function(options) {
            var self = this;
            options = options || {};
            this.loading.fire(options);
            return this._loadImpl(options).done(function(result) {
                    self.loaded.fire(result)
                })
        },
        _loadImpl: function(options) {
            var filter = options.filter,
                sort = options.sort,
                select = options.select,
                group = options.group,
                skip = options.skip,
                take = options.take,
                q = this.createQuery(options);
            if (filter)
                q = q.filter(filter);
            if (group)
                group = normalizeSortingInfo(group);
            if (sort) {
                sort = normalizeSortingInfo(sort);
                if (group)
                    sort = group.concat(sort);
                $.each(sort, function(index) {
                    q = q[index ? "thenBy" : "sortBy"](this.selector, this.desc)
                })
            }
            if (group)
                q = multiLevelGroup(q, group);
            if (take || skip)
                q = q.slice(skip || 0, take);
            if (select)
                q = q.select(select);
            return q.enumerate()
        },
        createQuery: abstract,
        byKey: function(key, extraOptions) {
            return this._addFailHandlers(this._byKeyImpl(key, extraOptions))
        },
        _byKeyImpl: abstract,
        insert: function(values) {
            var self = this;
            self.modifying.fire();
            self.inserting.fire(values);
            return self._addFailHandlers(self._insertImpl(values).done(function(callbackValues, callbackKey) {
                    self.inserted.fire(callbackValues, callbackKey);
                    self.modified.fire()
                }))
        },
        _insertImpl: abstract,
        update: function(key, values) {
            var self = this;
            self.modifying.fire();
            self.updating.fire(key, values);
            return self._addFailHandlers(self._updateImpl(key, values).done(function(callbackKey, callbackValues) {
                    self.updated.fire(callbackKey, callbackValues);
                    self.modified.fire()
                }))
        },
        _updateImpl: abstract,
        remove: function(key) {
            var self = this;
            self.modifying.fire();
            self.removing.fire(key);
            return self._addFailHandlers(self._removeImpl(key).done(function(callbackKey) {
                    self.removed.fire(callbackKey);
                    self.modified.fire()
                }))
        },
        _removeImpl: abstract,
        _addFailHandlers: function(deferred) {
            return deferred.fail(this._errorHandler, data._handleError)
        }
    })
})(jQuery, DevExpress);

// Module core, file data.store.array.js

(function($, DX, undefined) {
    var data = DX.data,
        Guid = data.Guid;
    var trivialPromise = function(_) {
            var d = $.Deferred();
            return d.resolve.apply(d, arguments).promise()
        };
    var rejectedPromise = function(_) {
            var d = $.Deferred();
            return d.reject.apply(d, arguments).promise()
        };
    data.ArrayStore = data.Store.inherit({
        ctor: function(options) {
            if ($.isArray(options))
                options = {data: options};
            else
                options = options || {};
            this.callBase(options);
            this._array = options.data || []
        },
        createQuery: function() {
            return data.query(this._array, {errorHandler: this._errorHandler})
        },
        _byKeyImpl: function(key) {
            return trivialPromise(this._array[this._indexByKey(key)])
        },
        _insertImpl: function(values) {
            var keyExpr = this.key(),
                keyValue,
                obj = {};
            $.extend(obj, values);
            if (keyExpr) {
                keyValue = this.keyOf(obj);
                if (keyValue === undefined || typeof keyValue === "object" && $.isEmptyObject(keyValue)) {
                    if ($.isArray(keyExpr))
                        throw Error("Compound keys cannot be auto-generated");
                    keyValue = obj[keyExpr] = String(new Guid)
                }
                else if (this._array[this._indexByKey(keyValue)] !== undefined)
                    return rejectedPromise(Error("Attempt to insert an item with the duplicate key"))
            }
            else
                keyValue = obj;
            this._array.push(obj);
            return trivialPromise(values, keyValue)
        },
        _updateImpl: function(key, values) {
            var target;
            if (this.key()) {
                var index = this._indexByKey(key);
                if (index < 0)
                    return rejectedPromise(Error("Data item not found"));
                target = this._array[index]
            }
            else
                target = key;
            $.extend(true, target, values);
            return trivialPromise(key, values)
        },
        _removeImpl: function(key) {
            var index = this._indexByKey(key);
            if (index > -1)
                this._array.splice(index, 1);
            return trivialPromise(key)
        },
        _indexByKey: function(key) {
            for (var i = 0, arrayLength = this._array.length; i < arrayLength; i++)
                if (data.utils.keysEqual(this.key(), this._keyGetter(this._array[i]), key))
                    return i;
            return -1
        }
    })
})(jQuery, DevExpress);

// Module core, file data.store.local.js

(function($, DX, undefined) {
    var Class = DX.Class,
        abstract = DX.abstract,
        data = DX.data;
    var LocalStoreBackend = Class.inherit({
            ctor: function(store, storeOptions) {
                this._store = store;
                this._dirty = false;
                var immediate = this._immediate = storeOptions.immediate;
                var flushInterval = Math.max(100, storeOptions.flushInterval || 10 * 1000);
                if (!immediate) {
                    var saveProxy = $.proxy(this.save, this);
                    setInterval(saveProxy, flushInterval);
                    $(window).on("beforeunload", saveProxy);
                    if (window.cordova)
                        document.addEventListener("pause", saveProxy, false)
                }
            },
            notifyChanged: function() {
                this._dirty = true;
                if (this._immediate)
                    this.save()
            },
            load: function() {
                this._store._array = this._loadImpl();
                this._dirty = false
            },
            save: function() {
                if (!this._dirty)
                    return;
                this._saveImpl(this._store._array);
                this._dirty = false
            },
            _loadImpl: abstract,
            _saveImpl: abstract
        });
    var DomLocalStoreBackend = LocalStoreBackend.inherit({
            ctor: function(store, storeOptions) {
                this.callBase(store, storeOptions);
                var name = storeOptions.name;
                if (!name)
                    throw Error("Name is required");
                this._key = "dx-data-localStore-" + name
            },
            _loadImpl: function() {
                var raw = localStorage.getItem(this._key);
                if (raw)
                    return JSON.parse(raw);
                return []
            },
            _saveImpl: function(array) {
                if (!array.length)
                    localStorage.removeItem(this._key);
                else
                    localStorage.setItem(this._key, JSON.stringify(array))
            }
        });
    var localStoreBackends = {dom: DomLocalStoreBackend};
    data.LocalStore = data.ArrayStore.inherit({
        ctor: function(options) {
            if (typeof options === "string")
                options = {name: options};
            else
                options = options || {};
            this.callBase(options);
            this._backend = new localStoreBackends[options.backend || "dom"](this, options);
            this._backend.load()
        },
        clear: function() {
            this._array = [];
            this._backend.notifyChanged()
        },
        _insertImpl: function(values) {
            var b = this._backend;
            return this.callBase(values).done($.proxy(b.notifyChanged, b))
        },
        _updateImpl: function(key, values) {
            var b = this._backend;
            return this.callBase(key, values).done($.proxy(b.notifyChanged, b))
        },
        _removeImpl: function(key) {
            var b = this._backend;
            return this.callBase(key).done($.proxy(b.notifyChanged, b))
        }
    })
})(jQuery, DevExpress);

// Module core, file data.store.odata.js

(function($, DX, undefined) {
    var Class = DX.Class,
        data = DX.data,
        odataUtils = data.utils.odata;
    var escapeServiceOperationParams = function(params) {
            if (!params)
                return params;
            var result = {};
            $.each(params, function(k, v) {
                result[k] = odataUtils.serializeValue(v)
            });
            return result
        };
    var convertSimpleKey = function(keyType, keyValue) {
            var converter = odataUtils.keyConverters[keyType];
            if (!converter)
                throw Error("Unknown key type: " + keyType);
            return converter(keyValue)
        };
    var SharedMethods = {
            _extractServiceOptions: function(options) {
                options = options || {};
                this._url = String(options.url).replace(/\/+$/, "");
                this._beforeSend = options.beforeSend;
                this._jsonp = options.jsonp
            },
            _sendRequest: function(url, method, params, payload) {
                return odataUtils.sendRequest({
                        url: url,
                        method: method,
                        params: params || {},
                        payload: payload
                    }, {
                        beforeSend: this._beforeSend,
                        jsonp: this._jsonp
                    })
            }
        };
    var ODataStore = data.Store.inherit({
            ctor: function(options) {
                this.callBase(options);
                this._extractServiceOptions(options);
                this._name = options.name;
                this._keyType = options.keyType
            },
            customLoadOptions: function() {
                return ["expand", "customQueryParams"]
            },
            _byKeyImpl: function(key, extraOptions) {
                var params = {};
                if (extraOptions)
                    if (extraOptions.expand)
                        params["$expand"] = $.map($.makeArray(extraOptions.expand), odataUtils.serializePropName).join();
                return this._sendRequest(this._byKeyUrl(key), "GET", params)
            },
            createQuery: function(loadOptions) {
                loadOptions = loadOptions || {};
                return data.query(this._url, {
                        beforeSend: this._beforeSend,
                        errorHandler: this._errorHandler,
                        jsonp: this._jsonp,
                        params: escapeServiceOperationParams(loadOptions.customQueryParams),
                        expand: loadOptions.expand
                    })
            },
            _insertImpl: function(values) {
                this._requireKey();
                var self = this,
                    d = $.Deferred();
                $.when(this._sendRequest(this._url, "POST", null, values)).done(function(serverResponse) {
                    d.resolve(values, self._keyGetter(serverResponse))
                }).fail($.proxy(d.reject, d));
                return d.promise()
            },
            _updateImpl: function(key, values) {
                var d = $.Deferred();
                $.when(this._sendRequest(this._byKeyUrl(key), "MERGE", null, values)).done(function() {
                    d.resolve(key, values)
                }).fail($.proxy(d.reject, d));
                return d.promise()
            },
            _removeImpl: function(key) {
                var d = $.Deferred();
                $.when(this._sendRequest(this._byKeyUrl(key), "DELETE")).done(function() {
                    d.resolve(key)
                }).fail($.proxy(d.reject, d));
                return d.promise()
            },
            _byKeyUrl: function(key) {
                var keyType = this._keyType;
                if ($.isPlainObject(keyType))
                    $.each(keyType, function(subKeyName, subKeyType) {
                        key[subKeyName] = convertSimpleKey(subKeyType, key[subKeyName])
                    });
                else if (keyType)
                    key = convertSimpleKey(keyType, key);
                return this._url + "(" + encodeURIComponent(odataUtils.serializeKey(key)) + ")"
            }
        }).include(SharedMethods);
    var ODataContext = Class.inherit({
            ctor: function(options) {
                var self = this;
                self._extractServiceOptions(options);
                self._errorHandler = options.errorHandler;
                $.each(options.entities || [], function(entityAlias, entityOptions) {
                    self[entityAlias] = new ODataStore($.extend({}, options, {url: self._url + "/" + encodeURIComponent(entityOptions.name || entityAlias)}, entityOptions))
                })
            },
            get: function(operationName, params) {
                return this.invoke(operationName, params, "GET")
            },
            invoke: function(operationName, params, httpMethod) {
                httpMethod = httpMethod || "POST";
                var d = $.Deferred();
                $.when(this._sendRequest(this._url + "/" + encodeURIComponent(operationName), httpMethod, escapeServiceOperationParams(params))).done(function(r) {
                    if (r && operationName in r)
                        r = r[operationName];
                    d.resolve(r)
                }).fail([this._errorHandler, data._handleError, $.proxy(d.reject, d)]);
                return d.promise()
            },
            objectLink: function(entityAlias, key) {
                var store = this[entityAlias];
                if (!store)
                    throw Error("Unknown entity name or alias: " + entityAlias);
                return {__metadata: {uri: store._byKeyUrl(key)}}
            }
        }).include(SharedMethods);
    $.extend(data, {
        ODataStore: ODataStore,
        ODataContext: ODataContext
    })
})(jQuery, DevExpress);

// Module core, file data.store.rest.js

(function($, DX, undefined) {
    var data = DX.data;
    function createAjaxFailureHandler(deferred) {
        return function(xhr, textStatus) {
                if (!xhr || !xhr.getResponseHeader)
                    deferred.reject.apply(deferred, arguments);
                else
                    deferred.reject(Error(data.utils.errorMessageFromXhr(xhr, textStatus)))
            }
    }
    function operationCustomizerPropName(operationName) {
        return "_customize" + DX.inflector.camelize(operationName, true)
    }
    function pathPropName(operationName) {
        return "_" + operationName + "Path"
    }
    data.RestStore = data.Store.inherit({
        ctor: function(options) {
            var self = this;
            self.callBase(options);
            options = options || {};
            self._url = String(options.url).replace(/\/+$/, "");
            self._jsonp = options.jsonp;
            $.each(["Load", "Insert", "Update", "Remove", "ByKey", "Operation"], function() {
                var value = options["customize" + this];
                if (value)
                    self[operationCustomizerPropName(this)] = value
            });
            $.each(["load", "insert", "update", "remove", "byKey"], function() {
                var value = options[this + "Path"];
                if (value)
                    self[pathPropName(this)] = value
            })
        },
        _loadImpl: function(options) {
            var d = $.Deferred(),
                ajaxOptions = {
                    url: this._formatUrlNoKey("load"),
                    type: "GET"
                };
            $.when(this._createAjax(ajaxOptions, "load", options)).done($.proxy(d.resolve, d)).fail(createAjaxFailureHandler(d));
            return this._addFailHandlers(d.promise())
        },
        createQuery: function() {
            throw Error("Not supported");
        },
        _insertImpl: function(values) {
            var d = $.Deferred(),
                self = this,
                ajaxOptions = {
                    url: this._formatUrlNoKey("insert"),
                    type: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(values)
                };
            $.when(this._createAjax(ajaxOptions, "insert")).done(function(serverResponse) {
                d.resolve(values, self.key() && self._keyGetter(serverResponse))
            }).fail(createAjaxFailureHandler(d));
            return d.promise()
        },
        _updateImpl: function(key, values) {
            var d = $.Deferred(),
                ajaxOptions = {
                    url: this._formatUrlWithKey("update", key),
                    type: "PUT",
                    contentType: "application/json",
                    data: JSON.stringify(values)
                };
            $.when(this._createAjax(ajaxOptions, "update")).done(function() {
                d.resolve(key, values)
            }).fail(createAjaxFailureHandler(d));
            return d.promise()
        },
        _removeImpl: function(key) {
            var d = $.Deferred(),
                ajaxOptions = {
                    url: this._formatUrlWithKey("remove", key),
                    type: "DELETE"
                };
            $.when(this._createAjax(ajaxOptions, "remove")).done(function() {
                d.resolve(key)
            }).fail(createAjaxFailureHandler(d));
            return d.promise()
        },
        _byKeyImpl: function(key) {
            var d = $.Deferred(),
                ajaxOptions = {
                    url: this._formatUrlWithKey("byKey", key),
                    type: "GET"
                };
            $.when(this._createAjax(ajaxOptions, "byKey")).done(function(data) {
                d.resolve(data)
            }).fail(createAjaxFailureHandler(d));
            return d.promise()
        },
        _createAjax: function(ajaxOptions, operationName, extra) {
            var customizationFunc,
                customizationResult;
            function isDeferred(obj) {
                return "done" in obj && "fail" in obj
            }
            if (this._jsonp && ajaxOptions.type === "GET")
                ajaxOptions.dataType = "jsonp";
            else
                $.extend(true, ajaxOptions, {xhrFields: {withCredentials: true}});
            customizationFunc = this[operationCustomizerPropName("operation")];
            if (customizationFunc) {
                customizationResult = customizationFunc(ajaxOptions, operationName, extra);
                if (customizationResult) {
                    if (isDeferred(customizationResult))
                        return customizationResult;
                    ajaxOptions = customizationResult
                }
            }
            customizationFunc = this[operationCustomizerPropName(operationName)];
            if (customizationFunc) {
                customizationResult = customizationFunc(ajaxOptions, extra);
                if (customizationResult) {
                    if (isDeferred(customizationResult))
                        return customizationResult;
                    ajaxOptions = customizationResult
                }
            }
            return $.ajax(ajaxOptions)
        },
        _formatUrlNoKey: function(operationName) {
            var url = this._url,
                path = this[pathPropName(operationName)];
            if (!path)
                return url;
            if ($.isFunction(path))
                return path(url);
            return url + "/" + path
        },
        _formatUrlWithKey: function(operationName, key) {
            var url = this._url,
                path = this[pathPropName(operationName)];
            if (!path)
                return url + "/" + encodeURIComponent(key);
            if ($.isFunction(path))
                return path(url, key);
            return url + "/" + path + "/" + encodeURIComponent(key)
        }
    })
})(jQuery, DevExpress);

// Module core, file data.store.simple.js

(function($, DX, undefined) {
    var data = DX.data;
    function operationCustomizerPropName(operationName) {
        return "_customize" + DX.inflector.camelize(operationName, true)
    }
    function pathPropName(operationName) {
        return "_" + operationName + "Path"
    }
    data.SimpleStore = data.Store.inherit({
        ctor: function(options) {
            var self = this;
            self.callBase(options);
            options = options || {};
            self.changed = options.changed;
            self.userLoadCallback = options.load;
            self.userLookupCallback = options.lookup
        },
        _loadImpl: function(loadOptions) {
            if (!this.userLoadCallback)
                throw new Error('Load callback was not defined');
            var loadOptions2 = {refresh: loadOptions.refresh};
            loadOptions2.searchString = loadOptions.searchString;
            var result = this.userLoadCallback(loadOptions2);
            if (!result)
                result = (new $.Deferred).resolve([]);
            if ($.isArray(result))
                result = (new $.Deferred).resolve(result);
            return result
        },
        lookup: function(key, lookupExpression, lookupGetter) {
            if (!this.userLookupCallback)
                throw new Error('Lookup callback was not defined');
            var result = this.userLookupCallback(key, lookupExpression, lookupGetter);
            if ($.isArray(result))
                result = result[0];
            if (!result)
                result = (new $.Deferred).resolve([]);
            if (!result.done)
                result = (new $.Deferred).resolve(result);
            return result
        }
    })
})(jQuery, DevExpress);

// Module core, file data.dataSource.js

(function($, DX, undefined) {
    var data = DX.data,
        Class = DX.Class;
    var LOCAL_KEY_PROP = "__key__";
    var emptyPromise = $.Deferred().resolve([]).promise();
    var DataSource = Class.inherit({
            ctor: function(options) {
                options = options || {};
                var store = options.store;
                if ($.isArray(store))
                    store = new data.ArrayStore(store);
                this._store = store;
                this._storeLoadOptions = this._extractLoadOptions(options);
                this._mapFunc = options.map;
                this._postProcessFunc = options.postProcess;
                this._pageIndex = 0;
                this._pageSize = options.pageSize !== undefined ? options.pageSize : 20;
                this._items = [];
                this._updateMode = options.updateMode || "item";
                this._isLoaded = false;
                this._paginate = options.paginate;
                if (this._paginate === undefined)
                    this._paginate = !this._isGrouped();
                this._isLastPage = !this._paginate;
                this.changed = $.Callbacks();
                this.loadError = $.Callbacks();
                store.updated.add(this._storeUpdatedHandler = $.proxy(this._handleStoreUpdated, this));
                store.inserted.add(this._storeInsertedHandler = $.proxy(this._handleStoreInserted, this));
                store.removed.add(this._storeRemovedHandler = $.proxy(this._handleStoreRemoved, this));
                this._customizeFilters = $.Callbacks()
            },
            dispose: function() {
                this.changed.empty();
                this.loadError.empty();
                this._store.updated.remove(this._storeUpdatedHandler);
                delete this._storeUpdatedHandler;
                this._store.inserted.remove(this._storeInsertedHandler);
                delete this._storeInsertedHandler;
                this._store.removed.remove(this._storeRemovedHandler);
                delete this._storeRemovedHandler;
                delete this._store;
                this._disposed = true
            },
            _extractLoadOptions: function(options) {
                var result = {},
                    names = ["sort", "filter", "select", "group"],
                    customNames = this._store.customLoadOptions();
                if (customNames)
                    names = names.concat(customNames);
                $.each(names, function() {
                    result[this] = options[this]
                });
                return result
            },
            loadOptions: function() {
                return this._storeLoadOptions
            },
            _accessStoreLoadOption: function(name, value) {
                var options = this._storeLoadOptions;
                if (arguments.length < 2)
                    return options[name];
                options[name] = value;
                this.reload()
            },
            filter: function(expr) {
                if (!arguments.length)
                    return this._accessStoreLoadOption("filter");
                if (expr && !$.isArray(expr))
                    expr = $.makeArray(arguments);
                this._accessStoreLoadOption("filter", expr)
            },
            clearFilter: function() {
                this.filter(null)
            },
            sortBy: function(expr) {
                if (arguments.length > 1)
                    expr = {
                        selector: arguments[0],
                        desc: arguments[1]
                    };
                this._accessStoreLoadOption("sort", expr)
            },
            clearSort: function() {
                this.sortBy(null)
            },
            store: function() {
                return this._store
            },
            key: function() {
                return this._store && this._store.key()
            },
            _isGrouped: function() {
                return !!this._storeLoadOptions.group
            },
            _assignPageIndex: function(value) {
                if (this._pageIndex === value)
                    return;
                this._pageIndex = value;
                this.load()
            },
            reload: function(options) {
                this._pageIndex = 0;
                this._isLastPage = !this._paginate;
                return this._loadCore(options)
            },
            load: function(options) {
                return this._loadCore(options)
            },
            isLoaded: function() {
                return this._isLoaded
            },
            lookup: function(options) {
                var d = new $.Deferred,
                    self = this,
                    key = options.key;
                options.lookupExpression = options.lookupExpression || self.key();
                if (this._store.lookup)
                    this._store.lookup(key).done(function(item) {
                        if (self._disposed)
                            return;
                        var transformed = self._transformLoadedData(item);
                        d.resolve(transformed[0])
                    });
                else if (options.lookupExpression && options.lookupExpression === self.key())
                    this._loadSingleByKey(key).done(function(item) {
                        d.resolve(item)
                    });
                else {
                    var newDataSource = self._store.toDataSource();
                    newDataSource.load({
                        searchString: key,
                        searchMethod: "=",
                        searchField: options.lookupExpression,
                        silent: true
                    }).done(function() {
                        if (self._disposed)
                            return;
                        var items = newDataSource.items();
                        var transformed = self._transformLoadedData(items);
                        d.resolve(transformed[0])
                    }).always(function() {
                        newDataSource.dispose()
                    })
                }
                return d
            },
            nextPage: function(append) {
                append = append === undefined ? true : append;
                if (this._isLastPage)
                    return emptyPromise;
                this._pageIndex++;
                var options = {append: append};
                $.extend(options, this._searchCondition);
                return this._loadCore(options)
            },
            _loadCore: function(options) {
                options = options || {};
                var self = this,
                    d = $.Deferred(),
                    errorCallback = self.loadError,
                    loadOptions = $.extend(true, {}, self._storeLoadOptions),
                    localFilter;
                if (!this.userDataSource && (options.searchField || loadOptions.searchFilter)) {
                    if (loadOptions.filter && !$.isArray(loadOptions.filter[0]))
                        loadOptions.filter = [loadOptions.filter];
                    loadOptions.filter = loadOptions.filter || [];
                    if (options.searchField)
                        localFilter = [options.searchField, options.searchMethod || "contains", options.searchString];
                    else
                        localFilter = loadOptions.searchFilter;
                    loadOptions.filter.push(localFilter);
                    self._storeLoadOptions.searchFilter = localFilter
                }
                if (this._paginate)
                    if (self._pageSize)
                        $.extend(loadOptions, {
                            skip: self._pageIndex * self._pageSize,
                            take: self._pageSize
                        });
                $.extend(loadOptions, {
                    refresh: !self._paginate || self._pageIndex === 0,
                    searchString: options.searchString
                });
                var loadTask = function() {
                        if (self._disposed)
                            return undefined;
                        return $.when(self._store.load(loadOptions)).done(function(data) {
                                DX.utils.executeAsync(function() {
                                    if (self._disposed)
                                        return;
                                    var items = self._items;
                                    data = self._transformLoadedData(data);
                                    if (!options.append)
                                        items.splice(0, items.length);
                                    items.push.apply(items, data);
                                    if (!data.length || !self._paginate || self._pageSize && data.length < self._pageSize)
                                        self._isLastPage = true;
                                    self._isLoaded = true;
                                    if (!options.silent)
                                        self.changed.fire();
                                    d.resolve(data)
                                })
                            }).fail($.proxy(d.reject, d))
                    };
                if (DataSourceLoadLock.locked())
                    DataSourceLoadLock.addTask(loadTask);
                else
                    loadTask();
                return d.promise().fail($.proxy(errorCallback.fire, errorCallback))
            },
            _loadSingleByKey: function(key) {
                var self = this,
                    d = $.Deferred();
                if (!self._disposed)
                    $.when(self._store.byKey(key)).done(function(item) {
                        if (self._disposed)
                            return;
                        var transformed = self._transformLoadedData(item);
                        d.resolve(transformed[0])
                    });
                return d.promise()
            },
            _transformLoadedData: function(data) {
                var self = this,
                    result;
                result = $.map($.makeArray(data), function(item, index) {
                    var keyValue = self._store.keyOf(item),
                        transformed;
                    if (self._mapFunc)
                        transformed = self._mapFunc(item, index);
                    else if (typeof item === "object")
                        transformed = $.extend({}, item);
                    else
                        transformed = item;
                    if (typeof item === "object")
                        transformed[LOCAL_KEY_PROP] = keyValue;
                    return transformed
                });
                if (self._postProcessFunc)
                    result = self._postProcessFunc(result);
                return result
            },
            _localIndexByKey: function(key) {
                var items = this._items,
                    len = items.length,
                    keyExpr = this._store.key(),
                    itemKey;
                for (var i = 0; i < len; i++) {
                    itemKey = items[i][LOCAL_KEY_PROP];
                    if (data.utils.keysEqual(keyExpr, itemKey, key))
                        return i
                }
                return -1
            },
            _handleStoreUpdated: function(key) {
                var self = this;
                switch (self._updateMode) {
                    case"full":
                        this.reload();
                        break;
                    case"item":
                        if (self._isGrouped())
                            return;
                        var localIndex = this._localIndexByKey(key);
                        if (localIndex < 0)
                            return;
                        self._loadSingleByKey(key).done(function(item) {
                            self._items.splice(localIndex, 1, item);
                            self.changed.fire()
                        });
                        break
                }
            },
            _handleStoreInserted: function(_, key) {
                var self = this;
                switch (self._updateMode) {
                    case"full":
                        self.reload();
                        break;
                    case"item":
                        if (self._isGrouped())
                            return;
                        self._loadSingleByKey(key).done(function(item) {
                            self._items.push(item);
                            self.changed.fire()
                        });
                        break
                }
            },
            _handleStoreRemoved: function(key) {
                var self = this;
                switch (self._updateMode) {
                    case"full":
                        self.reload();
                        break;
                    case"item":
                        if (self._isGrouped())
                            return;
                        var localIndex = this._localIndexByKey(key);
                        if (localIndex < 0)
                            return;
                        self._items.splice(localIndex, 1);
                        self.changed.fire();
                        break
                }
            }
        });
    var SimpleDataSource = DataSource.inherit({
            items: function() {
                return this._items
            },
            pageIndex: function(value) {
                if (value === undefined)
                    return this._pageIndex;
                this._assignPageIndex(value)
            },
            isLastPage: function() {
                return this._isLastPage
            }
        });
    var KoDataSource = DataSource.inherit({
            ctor: function(store, options) {
                this.callBase(store, options);
                var pinger = ko.observable();
                this.changed.add(function() {
                    pinger.notifySubscribers()
                });
                this.items = ko.computed(function() {
                    pinger();
                    return this._items
                }, this);
                this.pageIndex = ko.computed({
                    read: function() {
                        pinger();
                        return this._pageIndex
                    },
                    write: function(value) {
                        this._assignPageIndex(value)
                    }
                }, this);
                this.isLastPage = ko.computed(function() {
                    pinger();
                    return this._isLastPage
                }, this)
            },
            dispose: function() {
                this.callBase();
                this.items.dispose();
                this.pageIndex.dispose();
                this.isLastPage.dispose()
            }
        });
    data.Store.redefine({toDataSource: function(options, impl) {
            var dataSource;
            options = $.extend({store: this}, options);
            if ($.isFunction(impl))
                dataSource = new impl(options);
            else
                switch (impl) {
                    case"simple":
                        dataSource = new SimpleDataSource(options);
                        break;
                    default:
                        dataSource = new KoDataSource(options)
                }
            if (dataSource && this.changed && $.isFunction(this.changed.add))
                this.changed.add(function() {
                    dataSource.reload()
                });
            if (options.userDataSource)
                dataSource.userDataSource = options.userDataSource;
            return dataSource
        }});
    var createDataSource = function(dataSourceOptions) {
            var defaultDataSourceType = window.ko ? KoDataSource : SimpleDataSource;
            return new DX.data.SimpleStore(dataSourceOptions).toDataSource({
                    pageSize: null,
                    userDataSource: true
                }, defaultDataSourceType)
        };
    var DataSourceLoadLock = new function() {
            var delayedLoadTasks = [],
                lockCount = 0;
            var obtain = function() {
                    lockCount++
                };
            var release = function() {
                    lockCount--;
                    if (lockCount < 1) {
                        $.each(delayedLoadTasks, function() {
                            DX.enqueue(this)
                        });
                        delayedLoadTasks = []
                    }
                };
            return {
                    obtain: obtain,
                    release: release,
                    locked: function() {
                        return lockCount > 0
                    },
                    addTask: function(task) {
                        delayedLoadTasks.push(task)
                    }
                }
        };
    $.extend(true, data, {
        DataSource: DataSource,
        KoDataSource: KoDataSource,
        SimpleDataSource: SimpleDataSource,
        createDataSource: createDataSource,
        utils: {DataSourceLoadLock: DataSourceLoadLock}
    })
})(jQuery, DevExpress);

// Module core, file social.js

DevExpress.social = {};

// Module core, file facebook.js

(function($, DX, undefined) {
    var social = DX.social;
    var location = window.location,
        navigator = window.navigator,
        encodeURIComponent = window.encodeURIComponent,
        decodeURIComponent = window.decodeURIComponent,
        iosStandaloneMode = navigator.standalone,
        cordovaMode = false;
    if (window.cordova)
        $(document).on("deviceready", function() {
            cordovaMode = true
        });
    var ACCESS_TOKEN_KEY = "dx-facebook-access-token",
        IOS_STANDALONE_STEP1_KEY = "dx-facebook-step1",
        IOS_STANDALONE_STEP2_KEY = "dx-facebook-step2";
    var accessToken = null,
        expires = null,
        connectionChanged = $.Callbacks();
    var pendingLoginRedirectUrl;
    var isConnected = function() {
            return !!accessToken
        };
    var getAccessTokenObject = function() {
            return {
                    accessToken: accessToken,
                    expiresIn: accessToken ? expires : 0
                }
        };
    var FB = social.Facebook = {
            loginRedirectUrl: "FacebookLoginCallback.html",
            connectionChanged: connectionChanged,
            isConnected: isConnected,
            getAccessTokenObject: getAccessTokenObject,
            jsonp: false
        };
    var login = function(appId, options) {
            options = options || {};
            if (cordovaMode)
                pendingLoginRedirectUrl = "https://www.facebook.com/connect/login_success.html";
            else
                pendingLoginRedirectUrl = formatLoginRedirectUrl();
            var scope = (options.permissions || []).join(),
                url = "https://www.facebook.com/dialog/oauth?display=popup&client_id=" + appId + "&redirect_uri=" + encodeURIComponent(pendingLoginRedirectUrl) + "&scope=" + encodeURIComponent(scope) + "&response_type=token";
            if (iosStandaloneMode)
                putData(IOS_STANDALONE_STEP1_KEY, location.href);
            if (cordovaMode)
                startLogin_cordova(url);
            else
                startLogin_browser(url)
        };
    var formatLoginRedirectUrl = function() {
            var pathSegments = location.pathname.split(/\//g);
            pathSegments.pop();
            pathSegments.push(FB.loginRedirectUrl);
            return location.protocol + "//" + location.host + pathSegments.join("/")
        };
    var startLogin_browser = function(loginUrl) {
            var width = 512,
                height = 320,
                left = (screen.width - width) / 2,
                top = (screen.height - height) / 2;
            window.open(loginUrl, null, "width=" + width + ",height=" + height + ",toolbar=0,scrollbars=0,status=0,resizable=0,menuBar=0,left=" + left + ",top=" + top)
        };
    var startLogin_cordova = function(loginUrl) {
            var ref = window.open(loginUrl, "_blank");
            ref.addEventListener('exit', function(event) {
                pendingLoginRedirectUrl = null
            });
            ref.addEventListener('loadstop', function(event) {
                var url = unescape(event.url);
                if (url.indexOf(pendingLoginRedirectUrl) === 0) {
                    ref.close();
                    _processLoginRedirectUrl(url)
                }
            })
        };
    var handleLoginRedirect = function() {
            var opener = window.opener;
            if (iosStandaloneMode) {
                putData(IOS_STANDALONE_STEP2_KEY, location.href);
                location.href = getData(IOS_STANDALONE_STEP1_KEY)
            }
            else if (opener && opener.DevExpress) {
                opener.DevExpress.social.Facebook._processLoginRedirectUrl(location.href);
                window.close()
            }
        };
    var _processLoginRedirectUrl = function(url) {
            var params = parseUrlFragment(url);
            expires = params.expires_in;
            changeToken(params.access_token);
            pendingLoginRedirectUrl = null
        };
    var parseUrlFragment = function(url) {
            var hash = url.split("#")[1];
            if (!hash)
                return {};
            var pairs = hash.split(/&/g),
                result = {};
            $.each(pairs, function(i) {
                var splitPair = this.split("=");
                result[splitPair[0]] = decodeURIComponent(splitPair[1])
            });
            return result
        };
    var logout = function() {
            changeToken(null)
        };
    var changeToken = function(value) {
            if (value === accessToken)
                return;
            accessToken = value;
            putData(ACCESS_TOKEN_KEY, value);
            connectionChanged.fire(!!value)
        };
    var api = function(resource, method, params) {
            if (!isConnected())
                throw Error("Not connected");
            if (typeof method !== "string") {
                params = method;
                method = undefined
            }
            method = (method || "get").toLowerCase();
            var d = $.Deferred();
            var args = arguments;
            $.ajax({
                url: "https://graph.facebook.com/" + resource,
                type: method,
                data: $.extend({access_token: accessToken}, params),
                dataType: FB.jsonp && method === "get" ? "jsonp" : "json"
            }).done(function(response) {
                response = response || simulateErrorResponse();
                if (response.error)
                    d.reject(response.error);
                else
                    d.resolve(response)
            }).fail(function(xhr) {
                var response;
                try {
                    response = $.parseJSON(xhr.responseText);
                    var tries = args[3] || 0;
                    if (tries++ < 3 && response.error.code == 190 && response.error.error_subcode == 466) {
                        setTimeout(function() {
                            api(resource, method, params, tries).done(function(result) {
                                d.resolve(result)
                            }).fail(function(error) {
                                d.reject(error)
                            })
                        }, 500);
                        return
                    }
                }
                catch(x) {
                    response = simulateErrorResponse()
                }
                d.reject(response.error)
            });
            return d.promise()
        };
    var simulateErrorResponse = function() {
            return {error: {message: "Unknown error"}}
        };
    var ensureStorageBackend = function() {
            if (!hasStorageBackend())
                throw Error("HTML5 sessionStorage or jQuery.cookie plugin is required");
        };
    var hasStorageBackend = function() {
            return !!($.cookie || window.sessionStorage)
        };
    var putData = function(key, data) {
            ensureStorageBackend();
            data = JSON.stringify(data);
            if (window.sessionStorage)
                if (data === null)
                    sess.removeItem(key);
                else
                    sessionStorage.setItem(key, data);
            else
                $.cookie(key, data)
        };
    var getData = function(key) {
            ensureStorageBackend();
            try {
                return JSON.parse(window.sessionStorage ? sessionStorage.getItem(key) : $.cookie(key))
            }
            catch(x) {
                return null
            }
        };
    if (hasStorageBackend())
        accessToken = getData(ACCESS_TOKEN_KEY);
    if (iosStandaloneMode) {
        var url = getData(IOS_STANDALONE_STEP2_KEY);
        if (url) {
            _processLoginRedirectUrl(url);
            putData(IOS_STANDALONE_STEP1_KEY, null);
            putData(IOS_STANDALONE_STEP2_KEY, null)
        }
    }
    $.extend(FB, {
        login: login,
        logout: logout,
        handleLoginRedirect: handleLoginRedirect,
        _processLoginRedirectUrl: _processLoginRedirectUrl,
        api: api
    })
})(jQuery, DevExpress);

// Module core, file ui.js

(function($, DX, undefined) {
    var ui = DX.ui = {};
    var initViewport = function(options) {
            options = $.extend({}, options);
            var allowZoom = options.allowZoom,
                allowPan = options.allowPan;
            var metaSelector = "meta[name=viewport]";
            if (!$(metaSelector).length)
                $("<meta />").attr("name", "viewport").appendTo("head");
            var metaVerbs = ["width=device-width"],
                msTouchVerbs = [];
            if (allowZoom)
                msTouchVerbs.push("pinch-zoom");
            else
                metaVerbs.push("initial-scale=1.0", "maximum-scale=1.0");
            if (allowPan)
                msTouchVerbs.push("pan-x", "pan-y");
            if (!allowPan && !allowZoom)
                $("html, body").css("overflow", "hidden");
            else
                $("html").css("-ms-overflow-style", "-ms-autohiding-scrollbar");
            $(metaSelector).attr("content", metaVerbs.join());
            $("html").css("-ms-touch-action", msTouchVerbs.join(" ") || "none");
            if (DX.support.touch)
                $(document).on("touchmove", function(e) {
                    var count = e.originalEvent.touches.length;
                    if (!allowPan && count === 1 || !allowZoom && count > 1)
                        e.preventDefault()
                })
        };
    var hideAddressBar = function() {
            var ADDRESS_BAR_HEIGHT = 60;
            var isIphone = /iphone|ipod/i.test(navigator.appVersion),
                isBrowser = !navigator.standalone && /safari/i.test(navigator.userAgent);
            var doHide = function() {
                    window.scrollTo(0, 1)
                };
            var isInput = function($who) {
                    return $who.is(":input")
                };
            return function(e) {
                    var height,
                        $target = $(e.target),
                        $active = $(document.activeElement),
                        isTouch = e.type === "touchstart";
                    if (isTouch) {
                        if (isInput($target))
                            return;
                        if (isInput($active))
                            $active.blur()
                    }
                    else if (isInput($active))
                        return;
                    if (isIphone && isBrowser) {
                        height = $(window).height() + ADDRESS_BAR_HEIGHT;
                        if ($(document.body).height() !== height)
                            $(document.body).height(height)
                    }
                    setTimeout(doHide, 0)
                }
        }();
    var fix_Q477825 = function() {
            var yOffset = window.pageYOffset
        };
    if (DX.devices.current().ios) {
        $(window).on("load resize touchstart", hideAddressBar);
        $(function() {
            $(document.body).on("focusout", fix_Q477825)
        })
    }
    var Template = DX.Class.inherit({
            ctor: function(element) {
                this._element = $(element);
                this._template = $("<div />").append(element)
            },
            render: function(container) {
                var result = this._template.clone(true, true).contents();
                container.append(result);
                return result
            }
        });
    DX.registerActionExecutor({
        designMode: {validate: function(e) {
                if (DX.designMode && !(e.context instanceof ui.dxScrollable) && !(e.context instanceof ui.dxScrollView))
                    e.canceled = true
            }},
        gesture: {validate: function(e) {
                var args = e.args,
                    context = e.context,
                    component = args.length && args[0].component;
                if (ui.gestureUtils.hasRecent() && context !== ui.dxSwipeable && !(context instanceof ui.dxScrollable) && !(context instanceof ui.dxScrollView) && !(component instanceof ui.dxSwipeable) && !(component instanceof ui.dxScrollable))
                    e.canceled = true
            }},
        disabled: {validate: function(e) {
                if (!e.args.length)
                    return;
                var element = e.args[0].element;
                if (element && element.is(".dx-state-disabled, .dx-state-disabled *"))
                    e.canceled = true
            }},
        disabledCollectionContainerWidgetItem: {validate: function(e) {
                if (!e.args.length)
                    return;
                var element = e.args[0].itemElement;
                if (element && element.is(".dx-state-disabled *"))
                    e.canceled = true
            }}
    });
    $.extend(ui, {
        Template: Template,
        initViewport: initViewport
    });
    ui.__internals = {Template: Template}
})(jQuery, DevExpress);

// Module core, file ui.dialog.js

(function($, DX, undefined) {
    var ui = DX.ui;
    var DEFAULT_BUTTON = {
            text: "Ok",
            clickAction: function() {
                return true
            }
        };
    var DX_DIALOG_CLASSNAME = "dx-dialog",
        DX_DIALOG_ROOT_CLASSNAME = DX_DIALOG_CLASSNAME + "-root",
        DX_DIALOG_CONTENT_CLASSNAME = DX_DIALOG_CLASSNAME + "-content",
        DX_DIALOG_MESSAGE_CLASSNAME = DX_DIALOG_CLASSNAME + "-message",
        DX_DIALOG_BUTTONS_CLASSNAME = DX_DIALOG_CLASSNAME + "-buttons",
        DX_DIALOG_BUTTON_CLASSNAME = DX_DIALOG_CLASSNAME + "-button";
    var dialog = function(options) {
            var self,
                result,
                deferred,
                popupInstance;
            var show,
                hide;
            var $holder,
                $element,
                $message,
                $buttons;
            if (!ui.dxPopup)
                throw new Error("DevExpress.ui.dxPopup required.");
            self = this;
            deferred = $.Deferred();
            options = $.extend(ui.optionsByDevice(DX.devices.current(), "dxDialog"), options);
            $holder = $(".dx-viewport");
            $element = $("<div/>").addClass(DX_DIALOG_CLASSNAME).appendTo($holder);
            $message = $("<div/>").addClass(DX_DIALOG_MESSAGE_CLASSNAME).html(String(options.message));
            $buttons = $("<div/>").addClass(DX_DIALOG_BUTTONS_CLASSNAME);
            popupInstance = $element.dxPopup({
                title: options.title || self.title,
                fullscreen: false,
                height: "auto",
                width: function() {
                    var isPortrait = $(window).height() > $(window).width(),
                        key = (isPortrait ? "p" : "l") + "Width";
                    return options.hasOwnProperty(key) ? options[key] : options["width"]
                }
            }).data("dxPopup");
            $.each(options.buttons || [DEFAULT_BUTTON], function() {
                var button = $("<div/>").addClass(DX_DIALOG_BUTTON_CLASSNAME).appendTo($buttons);
                var action = new DX.Action(this.clickAction, {context: popupInstance});
                button.dxButton($.extend(this, {clickAction: function() {
                        result = action.execute(arguments);
                        hide()
                    }}))
            });
            popupInstance._element().addClass(DX_DIALOG_ROOT_CLASSNAME);
            popupInstance.content().addClass(DX_DIALOG_CONTENT_CLASSNAME).append($message).append($buttons);
            show = function() {
                popupInstance.show();
                return deferred.promise()
            };
            hide = function() {
                popupInstance.hide().done(function() {
                    popupInstance._element().remove()
                });
                deferred.resolve(result)
            };
            return {
                    show: show,
                    hide: hide
                }
        };
    var alert = function(message, title) {
            var dialogInstance,
                options = $.isPlainObject(message) ? message : {
                    title: title,
                    message: message
                };
            dialogInstance = dialog(options);
            return dialogInstance.show()
        };
    var confirm = function(message, title) {
            var dialogInstance,
                options = $.isPlainObject(message) ? message : {
                    title: title,
                    message: message,
                    buttons: [{
                            text: "Yes",
                            clickAction: function() {
                                return true
                            }
                        }, {
                            text: "No",
                            clickAction: function() {
                                return false
                            }
                        }]
                };
            dialogInstance = dialog(options);
            return dialogInstance.show()
        };
    var notify = function(message, type, displayTime) {
            var instance,
                options = $.isPlainObject(message) ? message : {message: message};
            if (!ui.dxToast) {
                alert(options.message);
                return
            }
            if (type)
                options.type = type;
            if (displayTime)
                options.displayTime = displayTime;
            instance = $("<div/>").appendTo($(".dx-viewport")).dxToast(options).data("dxToast");
            instance.option("hiddenAction", function() {
                this._element().remove();
                new DX.Action(options.hiddenAction, {context: this}).execute(arguments)
            });
            instance.show()
        };
    $.extend(ui, {
        notify: notify,
        dialog: {
            custom: dialog,
            alert: alert,
            confirm: confirm
        }
    })
})(jQuery, DevExpress);

// Module core, file ui.knockoutIntegration.js

(function($, DX, undefined) {
    var ko = window.ko;
    if (!ko)
        return;
    if (parseFloat(ko.version) < 2.2)
        throw Error("Your version of KnockoutJS is too old. Please upgrade KnockoutJS to 2.2.0 or later.");
    var ui = DX.ui,
        inflector = DX.inflector,
        DATA_BIND_ATTR = "data-bind",
        ANONYMOUS_BINDING_KEY = "unknown",
        ANONYMOUS_OPTION_NAME_FOR_OPTIONS_BAG = "_";
    var LOCKS_DATA_KEY = "dxKoLocks",
        MODEL_TO_OPTIONS_LOCK_NAME = "M2O",
        OPTIONS_TO_MODEL_LOCK_NAME = "O2M",
        CREATED_WITH_KO_DATA_KEY = "dxKoCreation";
    var defaultBindingProvider = ko.bindingProvider.instance,
        parseObjectLiteral = ko.jsonExpressionRewriting.parseObjectLiteral,
        bindingEvaluatorElement = $("<div></div>");
    var isComponentName = function(name) {
            return name in ui && ui[name].subclassOf && ui[name].subclassOf(ui.Component)
        };
    var stripQuotes = function(text) {
            return text.replace(/^['"]|['"]$/g, "")
        };
    var hideComponentBindings = function(element) {
            element = $(element);
            var bindingExpr = element.attr(DATA_BIND_ATTR);
            if (!bindingExpr)
                return;
            var parsedBindingExpr = parseObjectLiteral(bindingExpr),
                newBindingFragments = [],
                found = false;
            $.each(parsedBindingExpr, function() {
                var componentName = stripQuotes(this.key),
                    hiddenBindingsAttrName = "data-" + inflector.underscore(componentName);
                if (isComponentName(componentName) && !element.attr(hiddenBindingsAttrName)) {
                    found = true;
                    element.attr(hiddenBindingsAttrName, this.value);
                    newBindingFragments.push({
                        key: componentName,
                        value: "true"
                    })
                }
                else
                    newBindingFragments.push(this)
            });
            if (found)
                element.attr(DATA_BIND_ATTR, $.map(newBindingFragments, function(i) {
                    return i.key + ": " + i.value
                }).join(", "))
        };
    var PatchedBindingProvider = {
            _original: defaultBindingProvider,
            nodeHasBindings: function(node) {
                return defaultBindingProvider.nodeHasBindings(node)
            },
            getBindings: function(node, bindingContext) {
                hideComponentBindings(node);
                return defaultBindingProvider.getBindings(node, bindingContext)
            }
        };
    var Locks = function() {
            var info = {};
            var currentCount = function(lockName) {
                    return info[lockName] || 0
                };
            return {
                    obtain: function(lockName) {
                        info[lockName] = currentCount(lockName) + 1
                    },
                    release: function(lockName) {
                        var count = currentCount(lockName);
                        if (count < 1)
                            throw Error("Not locked");
                        if (count === 1)
                            delete info[lockName];
                        else
                            info[lockName] = count - 1
                    },
                    locked: function(lockName) {
                        return currentCount(lockName) > 0
                    }
                }
        };
    var registerComponentKoBinding = function(componentName) {
            var parseHiddenBindings = function(element) {
                    var bindingString = $.trim(element.attr("data-" + inflector.underscore(componentName))),
                        result,
                        firstItem;
                    if (bindingString.charAt(0) === "{") {
                        result = parseObjectLiteral(bindingString);
                        firstItem = result[0];
                        if (firstItem && ANONYMOUS_BINDING_KEY in firstItem)
                            result = $.trim(firstItem[ANONYMOUS_BINDING_KEY])
                    }
                    else
                        result = bindingString;
                    if (result === "")
                        result = [];
                    return result
                };
            ko.bindingHandlers[componentName] = {init: function(domNode) {
                    var element = $(domNode),
                        parsedBindings = parseHiddenBindings(element),
                        ctorOptions = {},
                        optionNameToModelMap = {};
                    var evalModelValue = function(optionName, modelValueExpr) {
                            bindingEvaluatorElement.attr(DATA_BIND_ATTR, optionName + ":" + modelValueExpr);
                            try {
                                return defaultBindingProvider.getBindings(bindingEvaluatorElement[0], ko.contextFor(domNode))[optionName]
                            }
                            finally {
                                bindingEvaluatorElement.removeAttr(DATA_BIND_ATTR)
                            }
                        };
                    var applyModelValueToOption = function(optionName, modelValue) {
                            var component = element.data(componentName),
                                locks = element.data(LOCKS_DATA_KEY),
                                optionValue = ko.utils.unwrapObservable(modelValue);
                            if (!component) {
                                ctorOptions[optionName] = optionValue;
                                if (ko.isWriteableObservable(modelValue))
                                    optionNameToModelMap[optionName] = modelValue
                            }
                            else {
                                if (locks.locked(OPTIONS_TO_MODEL_LOCK_NAME))
                                    return;
                                locks.obtain(MODEL_TO_OPTIONS_LOCK_NAME);
                                try {
                                    component.option(optionName, optionValue)
                                }
                                finally {
                                    locks.release(MODEL_TO_OPTIONS_LOCK_NAME)
                                }
                            }
                        };
                    var handleOptionChanged = function(optionName, optionValue) {
                            if (!(optionName in optionNameToModelMap))
                                return;
                            var element = this._$element,
                                locks = element.data(LOCKS_DATA_KEY);
                            if (locks.locked(MODEL_TO_OPTIONS_LOCK_NAME))
                                return;
                            locks.obtain(OPTIONS_TO_MODEL_LOCK_NAME);
                            try {
                                optionNameToModelMap[optionName](optionValue)
                            }
                            finally {
                                locks.release(OPTIONS_TO_MODEL_LOCK_NAME)
                            }
                        };
                    ko.utils.domNodeDisposal.addDisposeCallback(domNode, function() {
                        $.each(element.data("dxComponents") || [], function(index, item) {
                            element.data(item)._dispose()
                        })
                    });
                    if (typeof parsedBindings === "string")
                        ko.computed(function() {
                            $.each(ko.utils.unwrapObservable(evalModelValue(ANONYMOUS_OPTION_NAME_FOR_OPTIONS_BAG, parsedBindings)), applyModelValueToOption)
                        }, null, {disposeWhenNodeIsRemoved: domNode});
                    else
                        $.each(parsedBindings, function() {
                            var optionName = stripQuotes($.trim(this.key)),
                                modelValueExpr = $.trim(this.value);
                            ko.computed(function() {
                                var modelValue = evalModelValue(optionName, modelValueExpr);
                                applyModelValueToOption(optionName, modelValue)
                            }, null, {disposeWhenNodeIsRemoved: domNode})
                        });
                    if (ctorOptions) {
                        element.data(CREATED_WITH_KO_DATA_KEY, true);
                        element[componentName](ctorOptions);
                        ctorOptions = null;
                        element.data(LOCKS_DATA_KEY, new Locks);
                        element.data(componentName).optionChanged.add(handleOptionChanged)
                    }
                    return {controlsDescendantBindings: ui[componentName].subclassOf(ui.Widget)}
                }}
        };
    ko.bindingProvider.instance = PatchedBindingProvider;
    var KoTemplate = ui.Template.inherit({
            ctor: function(element) {
                this.callBase(element);
                this._cleanTemplateElement();
                this._registerKoTemplate()
            },
            _cleanTemplateElement: function() {
                this._element.each(function() {
                    ko.cleanNode(this)
                })
            },
            _registerKoTemplate: function() {
                var template = this._template.get(0);
                new ko.templateSources.anonymousTemplate(template)['nodes'](template)
            },
            render: function(container, data) {
                if (!$(container).closest("body").length)
                    throw Error("Attempt to render into container detached from document");
                data = data !== undefined ? data : ko.dataFor(container.get(0)) || {};
                var containerBindingContext = ko.contextFor(container[0]);
                var bindingContext = containerBindingContext ? containerBindingContext.createChildContext(data) : data;
                var renderBag = $("<div />").appendTo(container);
                ko.renderTemplate(this._template.get(0), bindingContext, null, renderBag.get(0));
                var result = renderBag.contents();
                container.append(result);
                renderBag.remove();
                return result
            }
        });
    ko.bindingHandlers.dxAction = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
            ko.bindingHandlers.click.init(element, function() {
                return function() {
                        $(element).data('action').execute({
                            element: $(element),
                            model: viewModel,
                            evaluate: function(expression) {
                                var context = viewModel;
                                if (expression.length > 0 && expression[0] === "$")
                                    context = ko.contextFor(element);
                                var getter = DX.data.utils.compileGetter(expression);
                                return getter(context)
                            }
                        })
                    }
            }, allBindingsAccessor, viewModel)
        },
        update: function(element, valueAccessor, allBindingsAccessor, viewModel) {
            var $element = $(element),
                actionSource = ko.utils.unwrapObservable(valueAccessor());
            $element.data('action', new DX.Action(actionSource, {context: $element}))
        }
    };
    var defaultKoTemplate = function() {
            var cache = {};
            return function(widgetName) {
                    if (!DEFAULT_ITEM_TEMPLATE_GENERATORS[widgetName])
                        widgetName = "base";
                    if (!cache[widgetName]) {
                        var html = DEFAULT_ITEM_TEMPLATE_GENERATORS[widgetName](),
                            markup = DX.utils.createMarkupFromString(html);
                        markup.each(function() {
                            hideComponentBindings($(this))
                        });
                        cache[widgetName] = new KoTemplate(markup)
                    }
                    return cache[widgetName]
                }
        }();
    var createElementWithBindAttr = function(tagName, bindings, closeTag) {
            closeTag = closeTag === undefined ? true : closeTag;
            var bindAttr = $.map(bindings, function(value, key) {
                    return key + ":" + value
                }).join(",");
            return "<" + tagName + " data-bind=\"" + bindAttr + "\">" + (closeTag ? "</" + tagName + ">" : "")
        };
    var defaultKoTemplateBasicBindings = {
            visible: "$data.visible === undefined || $data.visible",
            css: "{ 'dx-state-disabled': $data.disabled }"
        };
    var DEFAULT_ITEM_TEMPLATE_GENERATORS = {base: function() {
                var template = [createElementWithBindAttr("div", defaultKoTemplateBasicBindings, false)],
                    htmlBinding = createElementWithBindAttr("div", {html: "html"}),
                    textBinding = createElementWithBindAttr("div", {text: "text"}),
                    primitiveBinding = createElementWithBindAttr("div", {html: "String($data)"});
                template.push("<!-- ko if: $data.html -->", htmlBinding, "<!-- /ko -->", "<!-- ko if: !$data.html && $data.text -->", textBinding, "<!-- /ko -->", "<!-- ko ifnot: $.isPlainObject($data) -->", primitiveBinding, "<!-- /ko -->", "</div>");
                return template.join("")
            }};
    DEFAULT_ITEM_TEMPLATE_GENERATORS.dxList = function() {
        var template = DEFAULT_ITEM_TEMPLATE_GENERATORS.base(),
            keyBinding = createElementWithBindAttr("div", {html: "key"});
        template = [template.substring(0, template.length - 6), "<!-- ko if: $data.key -->" + keyBinding + "<!-- /ko -->", "</div>"];
        return template.join("")
    };
    DEFAULT_ITEM_TEMPLATE_GENERATORS.dxToolbar = function() {
        var template = DEFAULT_ITEM_TEMPLATE_GENERATORS.base();
        template = [template.substring(0, template.length - 6), "<!-- ko if: $data.widget -->"];
        $.each(["button", "tabs", "dropDownMenu"], function() {
            var bindingName = DX.inflector.camelize(["dx", "-", this].join("")),
                bindingObj = {};
            bindingObj[bindingName] = "$data.options";
            template.push("<!-- ko if: $data.widget === '", this, "' -->", createElementWithBindAttr("div", bindingObj), "<!-- /ko -->")
        });
        template.push("<!-- /ko -->");
        return template.join("")
    };
    DEFAULT_ITEM_TEMPLATE_GENERATORS.dxGallery = function() {
        var template = DEFAULT_ITEM_TEMPLATE_GENERATORS.base(),
            primitiveBinding = createElementWithBindAttr("div", {html: "String($data)"}),
            imgBinding = createElementWithBindAttr("img", {attr: "{ src: String($data) }"}, false);
        template = template.replace(primitiveBinding, imgBinding);
        return template
    };
    DEFAULT_ITEM_TEMPLATE_GENERATORS.dxTabs = function() {
        var template = DEFAULT_ITEM_TEMPLATE_GENERATORS.base(),
            baseTextBinding = createElementWithBindAttr("div", {text: "text"}),
            iconBinding = createElementWithBindAttr("span", {
                attr: "{ 'class': 'dx-icon-' + $data.icon }",
                css: "{ 'dx-icon': true }"
            }),
            iconSrcBinding = createElementWithBindAttr("img", {
                attr: "{ src: $data.iconSrc }",
                css: "{ 'dx-icon': true }"
            }, false),
            textBinding = "<!-- ko if: $data.icon -->" + iconBinding + "<!-- /ko -->" + "<!-- ko if: !$data.icon && $data.iconSrc -->" + iconSrcBinding + "<!-- /ko -->" + "<span class=\"dx-tab-text\" data-bind=\"text: $data.text\"></span>";
        template = template.replace("<!-- ko if: !$data.html && $data.text -->", "<!-- ko if: !$data.html && ($data.text || $data.icon || $data.iconSrc) -->").replace(baseTextBinding, textBinding);
        return template
    };
    DEFAULT_ITEM_TEMPLATE_GENERATORS.dxActionSheet = function() {
        return createElementWithBindAttr("div", {dxButton: "{ text: $data.text, clickAction: $data.clickAction, type: $data.type, disabled: !!$data.disabled }"})
    };
    DEFAULT_ITEM_TEMPLATE_GENERATORS.dxNavBar = DEFAULT_ITEM_TEMPLATE_GENERATORS.dxTabs;
    $.extend(ui, {
        registerComponentKoBinding: registerComponentKoBinding,
        Template: KoTemplate,
        defaultTemplate: defaultKoTemplate
    })
})(jQuery, DevExpress);

// Module core, file ui.gestureUtils.js

(function($, DX, undefined) {
    var ui = DX.ui,
        support = DX.support,
        TOUCH = support.touch,
        UNLOCK_ACTION_TIMEOUT = 400;
    var gestureUtils = function() {
            var actionLocked = false,
                unlockActionTimer = null,
                gestureStartCallbacks = $.Callbacks();
            var notifyGestureStart = function() {
                    clearTimeout(unlockActionTimer);
                    unlockActionTimer = null;
                    actionLocked = true;
                    gestureStartCallbacks.fire()
                };
            var notifyGestureEnd = function() {
                    if (unlockActionTimer)
                        return;
                    unlockActionTimer = setTimeout(function() {
                        actionLocked = false;
                        unlockActionTimer = null
                    }, UNLOCK_ACTION_TIMEOUT)
                };
            var hasRecentGesture = function() {
                    return actionLocked
                };
            var android4nativeBrowser = /^4\.0/.test(DX.devices.androidVersion()) && navigator.userAgent.indexOf("Chrome") === -1;
            var preventHangingCursor = function() {
                    if (TOUCH)
                        if (android4nativeBrowser)
                            androidInputBlur();
                        else if (document.activeElement)
                            document.activeElement.blur()
                };
            var androidInputBlur = function() {
                    var $specInput = $("<input>").addClass("dx-hidden-input").appendTo("body");
                    setTimeout(function() {
                        $specInput.focus();
                        setTimeout(function() {
                            $specInput.hide();
                            $specInput.remove()
                        }, 100)
                    }, 100)
                };
            var preventNativeElastic = function(e) {
                    if (TOUCH)
                        e.preventDefault()
                };
            var needSkipEvent = function(e) {
                    return $(e.target).is("input, textarea, select")
                };
            var forgetRecentGesture = function() {
                    actionLocked = false;
                    clearTimeout(unlockActionTimer);
                    unlockActionTimer = null
                };
            return {
                    gestureStartCallbacks: gestureStartCallbacks,
                    preventHangingCursor: preventHangingCursor,
                    preventNativeElastic: preventNativeElastic,
                    needSkipEvent: needSkipEvent,
                    notifyStart: notifyGestureStart,
                    notifyEnd: notifyGestureEnd,
                    hasRecent: hasRecentGesture,
                    forget: forgetRecentGesture
                }
        }();
    gestureUtils.__internals = {
        UNLOCK_ACTION_TIMEOUT: UNLOCK_ACTION_TIMEOUT,
        setUnlockTimeout: function(timeout) {
            UNLOCK_ACTION_TIMEOUT = timeout
        }
    };
    ui.gestureUtils = gestureUtils
})(jQuery, DevExpress);

// Module core, file ui.dataHelper.js

(function($, DX, undefined) {
    var data = DX.data;
    var DATA_SOURCE_OPTIONS_METHOD = "_dataSourceOptions",
        DATA_SOURCE_CHANGED_METHOD = "_handleDataSourceChanged",
        DATA_SOURCE_LOAD_ERROR_METHOD = "_handleDataSourceLoadError";
    DX.ui.DataHelperMixin = {
        ctor: function() {
            this.disposing.add(function() {
                this._disposeDataSource()
            })
        },
        _initDataSource: function() {
            var self = this,
                dataSourceOptions = self.option("dataSource"),
                dataSource,
                widgetDataSourceOptions = DATA_SOURCE_OPTIONS_METHOD in this ? this[DATA_SOURCE_OPTIONS_METHOD]() : {},
                dataSourceType = self._dataSourceType ? self._dataSourceType() : data.SimpleDataSource;
            self._disposeDataSource();
            if (!dataSourceOptions)
                return;
            if ($.isArray(dataSourceOptions))
                dataSource = new data.ArrayStore(dataSourceOptions).toDataSource(widgetDataSourceOptions, dataSourceType);
            else if ($.isPlainObject(dataSourceOptions))
                if ('load' in dataSourceOptions)
                    dataSource = data.createDataSource(dataSourceOptions);
                else {
                    if (!dataSourceOptions.store && !DX.designMode)
                        throw Error("Please specify 'load' function for the dataSource");
                    dataSource = new dataSourceType($.extend(true, {}, widgetDataSourceOptions, dataSourceOptions))
                }
            else if (dataSourceOptions instanceof data.DataSource) {
                self._sharedDataSource = true;
                dataSource = dataSourceOptions
            }
            else if (dataSourceOptions instanceof data.Store)
                dataSource = dataSourceOptions.toDataSource(widgetDataSourceOptions, dataSourceType);
            else
                throw Error("Invalid dataSource option");
            self._dataSource = dataSource;
            dataSource.changed.add(self._dataSourceChangedHandler = function() {
                self._dataSourceLoading = false;
                self[DATA_SOURCE_CHANGED_METHOD](dataSource.items())
            });
            if (DATA_SOURCE_LOAD_ERROR_METHOD in self)
                dataSource.loadError.add(self._dataSourceLoadErrorHandler = $.proxy(self[DATA_SOURCE_LOAD_ERROR_METHOD], self))
        },
        _loadDataSource: function() {
            var ds = this._dataSource;
            if (!ds)
                return;
            if (ds.isLoaded())
                this._dataSourceChangedHandler();
            else {
                this._dataSourceLoading = true;
                ds.load()
            }
        },
        _disposeDataSource: function() {
            if (!this._dataSource)
                return;
            if (!this._sharedDataSource)
                this._dataSource.dispose();
            else {
                delete this._sharedDataSource;
                this._dataSource.changed.remove(this._dataSourceChangedHandler);
                this._dataSource.loadError.remove(this._dataSourceLoadErrorHandler)
            }
            delete this._dataSource;
            delete this._dataSourceChangedHandler;
            delete this._dataSourceLoadErrorHandler
        }
    }
})(jQuery, DevExpress);

// Module core, file ui.eventHelper.js

(function($, DX, undefined) {
    var ui = DX.ui,
        gestureUtils = ui.gestureUtils;
    var EventHelper = DX.Class.inherit({
            EVENT_SOURCES_REGEX: {
                mouse: /^mouse/i,
                touch: /^touch/i,
                keyboard: /^key/i
            },
            EVENTS: {
                click: "click",
                start: "touchstart mousedown",
                move: "touchmove mousemove",
                end: "touchend mouseup",
                cancel: "touchcancel",
                wheel: "mousewheel"
            },
            ctor: function(namespace) {
                this._namespace = namespace
            },
            eventSource: function(e) {
                var result = "other";
                $.each(this.EVENT_SOURCES_REGEX, function(key) {
                    if (this.test(e.type)) {
                        result = key;
                        return false
                    }
                });
                return result
            },
            isMouseEvent: function(e) {
                return this.eventSource(e) === "mouse"
            },
            isTouchEvent: function(e) {
                return this.eventSource(e) === "touch"
            },
            isKeyboardEvent: function() {
                return this.eventSource(e) === "keyboard"
            },
            eventName: function(type) {
                var self = this;
                var events = this.EVENTS[type] || type;
                events = events.split(/\W+/g);
                $.each(events, function(index, eventName) {
                    events[index] = eventName + "." + self._namespace
                });
                return events.join(" ")
            },
            eventX: function(e) {
                if (this.isMouseEvent(e))
                    return e.pageX;
                if (this.isTouchEvent(e))
                    return e.originalEvent.touches[0].pageX
            },
            eventY: function(e) {
                if (this.isMouseEvent(e))
                    return e.pageY;
                if (this.isTouchEvent(e))
                    return e.originalEvent.touches[0].pageY
            },
            eventData: function(e) {
                if (this.isMouseEvent(e))
                    return {
                            x: e.pageX,
                            y: e.pageY,
                            time: e.timeStamp
                        };
                if (this.isTouchEvent(e)) {
                    var touch = (e.changedTouches || e.originalEvent.changedTouches)[0];
                    return {
                            x: touch.pageX,
                            y: touch.pageY,
                            time: e.timeStamp
                        }
                }
            },
            eventDelta: function(from, to) {
                return {
                        x: to.x - from.x,
                        y: to.y - from.y,
                        time: to.time - from.time || 1
                    }
            },
            hasTouches: function(e) {
                if (this.isMouseEvent(e))
                    return 0;
                if (this.isTouchEvent(e))
                    return e.originalEvent.touches.length
            },
            needSkipEvent: function(e) {
                if (this.isMouseEvent(e))
                    return gestureUtils.needSkipEvent(e) || e.which !== 1;
                if (this.isTouchEvent(e))
                    return (e.changedTouches || e.originalEvent.changedTouches).length !== 1
            }
        });
    var MOUSE_EVENT_LOCK_TIMEOUT = 400,
        mouseLocked = false,
        unlockMouseTimer = null;
    DX.registerActionExecutor("ignoreMouseAfterTouch", {validate: function(e) {
            var event = e.args[0];
            if (event && event.jQueryEvent)
                event = event.jQueryEvent;
            if (!(event instanceof $.Event))
                return;
            if (EventHelper.prototype.isTouchEvent(event)) {
                mouseLocked = true;
                clearTimeout(unlockMouseTimer);
                unlockMouseTimer = setTimeout(function() {
                    mouseLocked = false
                }, MOUSE_EVENT_LOCK_TIMEOUT)
            }
            else if (EventHelper.prototype.isMouseEvent(event))
                if (mouseLocked)
                    e.canceled = true
        }});
    DX.ui.EventHelper = EventHelper
})(jQuery, DevExpress);

// Module core, file ui.component.js

(function($, DX, undefined) {
    var COMPONENT_NAMES_DATA_KEY = "dxComponents",
        HAS_KO = !!window.ko,
        CREATED_WITH_KO_DATA_KEY = "dxKoCreation",
        ui = DX.ui,
        dataUtils = DX.data.utils,
        DISABLED_STATE_CLASS = "dx-state-disabled";
    var Component = DX.Class.inherit({
            NAME: null,
            _defaultOptions: function() {
                return {disabled: false}
            },
            _createdWithKo: function() {
                return !!this._element().data(CREATED_WITH_KO_DATA_KEY)
            },
            ctor: function(element, options) {
                if (!this.NAME)
                    throw Error("NAME is not specified");
                this._$element = $(element);
                this._element().data(this.NAME, this);
                if (!this._element().data(COMPONENT_NAMES_DATA_KEY))
                    this._element().data(COMPONENT_NAMES_DATA_KEY, []);
                this._element().data(COMPONENT_NAMES_DATA_KEY).push(this.NAME);
                this._options = {};
                this._updateLockCount = 0;
                this._requireRefresh = false;
                this._eventHelper = new ui.EventHelper(this.NAME);
                this.optionChanged = $.Callbacks();
                this.disposing = $.Callbacks();
                this.beginUpdate();
                try {
                    var device = DX.devices.current(),
                        optionsByDevice = ui.optionsByDevice(device, this.NAME) || {},
                        defaultOptions = $.extend(this._defaultOptions(), optionsByDevice);
                    this.option(defaultOptions);
                    this._initOptions(options || {})
                }
                finally {
                    this.endUpdate()
                }
            },
            _initOptions: function(options) {
                this.option(options)
            },
            _optionValuesEqual: function(name, oldValue, newValue) {
                oldValue = dataUtils.toComparable(oldValue, true);
                newValue = dataUtils.toComparable(newValue, true);
                if (oldValue === null || typeof oldValue !== "object")
                    return oldValue === newValue;
                return false
            },
            _init: $.noop,
            _render: function() {
                this._renderDisabledState()
            },
            _clean: $.noop,
            _invalidate: function() {
                if (!this._updateLockCount)
                    throw Error("Invalidate called outside update transaction");
                this._requireRefresh = true
            },
            _refresh: function() {
                this._clean();
                this._render()
            },
            _dispose: function() {
                this._clean();
                this.optionChanged.empty();
                this.disposing.fireWith(this).empty()
            },
            _renderDisabledState: function() {
                this._element().toggleClass(DISABLED_STATE_CLASS, this.option("disabled"))
            },
            _createAction: function(actionSource, config) {
                var self = this;
                config = $.extend({}, config);
                var element = config.element || self._element(),
                    model = self._modelByElement(element);
                config.context = model || self;
                config.component = self;
                var action = new DX.Action(actionSource, config);
                return function(e) {
                        if (!$.isPlainObject(e))
                            e = {actionValue: e};
                        return action.execute.call(action, $.extend(e, {
                                component: self,
                                element: element,
                                model: model
                            }))
                    }
            },
            _createActionByOption: function(optionName, config) {
                if (typeof optionName !== "string")
                    throw Error("Option name type is unexpected");
                return this._createAction(this.option(optionName), config)
            },
            _modelByElement: function(element) {
                if (HAS_KO && element.length)
                    return ko.dataFor(element.get(0))
            },
            _optionChanged: function(name, value, prevValue) {
                if (name === "disabled")
                    this._renderDisabledState();
                else
                    this._invalidate()
            },
            _element: function() {
                return this._$element
            },
            instance: function() {
                return this
            },
            beginUpdate: function() {
                this._updateLockCount++
            },
            endUpdate: function() {
                this._updateLockCount--;
                if (!this._updateLockCount)
                    if (!this._initializing && !this._initialized) {
                        this._initializing = true;
                        try {
                            this._init()
                        }
                        finally {
                            this._initializing = false;
                            this._initialized = true
                        }
                        this._render()
                    }
                    else if (this._requireRefresh) {
                        this._requireRefresh = false;
                        this._refresh()
                    }
            },
            option: function(options) {
                var self = this,
                    name = options,
                    value = arguments[1];
                if (arguments.length < 2 && $.type(name) !== "object")
                    return dataUtils.compileGetter(name)(self._options, {functionsAsIs: true});
                if (typeof name === "string") {
                    options = {};
                    options[name] = value
                }
                self.beginUpdate();
                try {
                    $.each(options, function(name, value) {
                        var prevValue = dataUtils.compileGetter(name)(self._options, {functionsAsIs: true}),
                            topLevelName;
                        if (self._optionValuesEqual(name, prevValue, value))
                            return;
                        dataUtils.compileSetter(name)(self._options, value, {
                            functionsAsIs: true,
                            merge: true
                        });
                        topLevelName = name.split(/[.\[]/)[0];
                        if (self._initialized) {
                            self.optionChanged.fireWith(self, [topLevelName, value, prevValue]);
                            self._optionChanged(topLevelName, value, prevValue)
                        }
                    })
                }
                finally {
                    self.endUpdate()
                }
            }
        });
    var registerComponent = function(name, componentClass) {
            ui[name] = componentClass;
            componentClass.prototype.NAME = name;
            $.fn[name] = function(options) {
                var isMemberInvoke = typeof options === "string",
                    result = this;
                if (isMemberInvoke) {
                    var memberName = options,
                        memberArgs = $.makeArray(arguments).slice(1);
                    this.each(function() {
                        var instance = $(this).data(name);
                        if (!instance)
                            throw Error("Component " + name + " has not been initialized on this element");
                        var member = instance[memberName],
                            memberValue = member.apply(instance, memberArgs);
                        if (memberValue !== undefined) {
                            result = memberValue;
                            return false
                        }
                    })
                }
                else
                    this.each(function() {
                        var instance = $(this).data(name);
                        if (instance)
                            instance.option(options);
                        else
                            new componentClass(this, options)
                    });
                return result
            };
            if (HAS_KO)
                ui.registerComponentKoBinding(name)
        };
    var getComponents = function(element) {
            element = $(element);
            var names = element.data(COMPONENT_NAMES_DATA_KEY);
            if (!names)
                return [];
            return $.map(names, function(name) {
                    return element.data(name)
                })
        };
    function cleanComponentsAndKoData(element, andSelf) {
        element.each(function() {
            var all = this.getElementsByTagName ? this.getElementsByTagName("*") : [];
            if (andSelf)
                all = jQuery.merge([this], all);
            for (var i = 0, item; (item = all[i]) != null; i++) {
                $.each(getComponents(item), function() {
                    this._dispose()
                });
                if (HAS_KO)
                    ko.cleanNode(item)
            }
        })
    }
    var originalEmpty = $.fn.empty;
    $.fn.empty = function() {
        cleanComponentsAndKoData(this, false);
        return originalEmpty.apply(this, arguments)
    };
    var originalRemove = $.fn.remove;
    $.fn.remove = function(selector, keepData) {
        if (!keepData) {
            var subject = this;
            if (selector)
                subject = subject.filter(selector);
            cleanComponentsAndKoData(subject, true)
        }
        return originalRemove.call(this, selector, keepData)
    };
    var originalHtml = $.fn.html;
    $.fn.html = function(value) {
        if (typeof value === "string")
            cleanComponentsAndKoData(this, false);
        return originalHtml.apply(this, arguments)
    };
    var originalParseHtml = $.parseHTML;
    $.parseHTML = function() {
        return originalParseHtml.apply(this, arguments) || []
    };
    $.extend(ui, {
        registerComponent: registerComponent,
        Component: Component
    })
})(jQuery, DevExpress);

// Module core, file ui.widget.js

(function($, DX, undefined) {
    var ui = DX.ui,
        UI_FEEDBACK = "UIFeedback",
        UI_FEEDBACK_CLASS = "dx-feedback",
        ACTIVE_STATE_CLASS = "dx-state-active",
        DISABLED_STATE_CLASS = "dx-state-disabled",
        INVISIBLE_STATE_CLASS = "dx-state-invisible",
        FEEDBACK_SHOW_TIMEOUT = 30,
        FEEDBACK_HIDE_TIMEOUT = 400;
    var activeElement,
        eventHelper = new ui.EventHelper(UI_FEEDBACK),
        feedbackLocked = false;
    ui.feedback = {
        lock: function() {
            feedbackLocked = true
        },
        unlock: function() {
            window.setTimeout(function() {
                feedbackLocked = false
            }, 0)
        }
    };
    ui.Widget = ui.Component.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    visible: true,
                    activeStateEnabled: true,
                    width: undefined,
                    height: undefined,
                    clickAction: null
                })
        },
        _init: function() {
            this.callBase();
            this._feedbackShowTimeout = FEEDBACK_SHOW_TIMEOUT
        },
        _render: function() {
            this.callBase();
            this._element().addClass("dx-widget");
            this._toggleVisibility(this.option("visible"));
            this._refreshFeedback();
            this._renderDimensions();
            this._renderClick()
        },
        _dispose: function() {
            this._clearTimers();
            if (activeElement && activeElement.closest(this._element()).length)
                activeElement = null;
            this.callBase()
        },
        _clean: function() {
            this.callBase();
            this._element().empty()
        },
        _clearTimers: function() {
            clearTimeout(this._feedbackHideTimer);
            clearTimeout(this._feedbackShowTimer)
        },
        _toggleVisibility: function(visible) {
            this._element().toggleClass(INVISIBLE_STATE_CLASS, !visible)
        },
        _renderDimensions: function() {
            var width = this.option("width"),
                height = this.option("height");
            this._element().width(width);
            this._element().height(height)
        },
        _refreshFeedback: function() {
            if (this._feedbackDisabled()) {
                this._feedbackOff();
                this._element().removeClass(UI_FEEDBACK_CLASS)
            }
            else
                this._element().addClass(UI_FEEDBACK_CLASS)
        },
        _renderClick: function() {
            var eventName = this._eventHelper.eventName("click");
            this._element().off(eventName).on(eventName, this._createActionByOption("clickAction"))
        },
        _feedbackDisabled: function() {
            return !this.option("activeStateEnabled") || this.option("disabled")
        },
        _feedbackOn: function(element, immediate) {
            if (this._feedbackDisabled() || feedbackLocked)
                return;
            this._clearTimers();
            if (immediate)
                this._feedbackShow(element);
            else
                this._feedbackShowTimer = window.setTimeout($.proxy(this._feedbackShow, this, element), this._feedbackShowTimeout);
            this._saveActiveElement()
        },
        _feedbackShow: function(element) {
            var activeStateElement = this._element();
            if (this._activeStateUnit)
                activeStateElement = $(element).closest(this._activeStateUnit);
            if (!activeStateElement.hasClass(DISABLED_STATE_CLASS))
                activeStateElement.addClass(ACTIVE_STATE_CLASS)
        },
        _saveActiveElement: function() {
            activeElement = this._element()
        },
        _feedbackOff: function(isGestureStart, immediate) {
            this._clearTimers();
            if (immediate)
                this._feedbackHide();
            else
                this._feedbackHideTimer = window.setTimeout($.proxy(this._feedbackHide, this), FEEDBACK_HIDE_TIMEOUT)
        },
        _feedbackHide: function() {
            var activeStateElement = this._element();
            if (this._activeStateUnit)
                activeStateElement = activeStateElement.find(this._activeStateUnit);
            activeStateElement.removeClass(ACTIVE_STATE_CLASS);
            this._clearActiveElement()
        },
        _clearActiveElement: function() {
            var rootDomElement = this._element().get(0),
                activeDomElement = activeElement && activeElement.get(0);
            if (activeDomElement && (activeDomElement === rootDomElement || $.contains(rootDomElement, activeDomElement)))
                activeElement = null
        },
        _optionChanged: function(name, value) {
            switch (name) {
                case"disabled":
                    this.callBase.apply(this, arguments);
                case"activeStateEnabled":
                    this._refreshFeedback();
                    break;
                case"visible":
                    this._toggleVisibility(value);
                    break;
                case"width":
                case"height":
                    this._renderDimensions();
                    break;
                case"clickAction":
                    this._renderClick();
                    break;
                default:
                    this.callBase.apply(this, arguments)
            }
        }
    });
    var handleStart = function(e, immediate) {
            if (eventHelper.needSkipEvent(e))
                return;
            if (activeElement)
                getWidget(activeElement)._feedbackOff(false, true);
            var closestFeedbackElement = $(e.target).closest("." + UI_FEEDBACK_CLASS),
                widget;
            if (closestFeedbackElement.length) {
                widget = getWidget(closestFeedbackElement);
                widget._feedbackOn(e.target, immediate);
                if (immediate)
                    widget._feedbackOff()
            }
        };
    var handleEnd = function(isGestureStart) {
            if (!activeElement)
                return;
            getWidget(activeElement)._feedbackOff(isGestureStart)
        };
    var getWidget = function(widgetElement) {
            var result;
            $.each(widgetElement.data("dxComponents"), function(index, componentName) {
                if (ui[componentName].subclassOf(ui.Widget)) {
                    result = widgetElement.data(componentName);
                    return false
                }
            });
            return result
        };
    $(function() {
        var startAction = new DX.Action(handleStart);
        $(document).on(eventHelper.eventName("start"), function(e) {
            startAction.execute(e)
        }).on(eventHelper.eventName("end") + " " + eventHelper.eventName("cancel"), function(e) {
            var activeElementClicked = activeElement && $(e.target).closest("." + UI_FEEDBACK_CLASS).get(0) === activeElement.get(0);
            if (!DX.ui.gestureUtils.hasRecent() && activeElementClicked)
                startAction.execute(e, true);
            handleEnd()
        });
        ui.gestureUtils.gestureStartCallbacks.add(function() {
            handleEnd(true)
        })
    })
})(jQuery, DevExpress);

// Module core, file ui.containerWidget.js

(function($, DX, undefined) {
    var ui = DX.ui,
        ANONYMOUS_TEMPLATE_NAME = "template";
    var getTemplateOptions = function(element) {
            var options = element.data("options");
            if ($.trim(options).charAt(0) !== "{")
                options = "{" + options + "}";
            return new Function("return " + options)().dxTemplate
        };
    var ContainerWidget = ui.Widget.inherit({
            _init: function() {
                this.callBase();
                this._initTemplates()
            },
            _clean: $.noop,
            _initTemplates: function() {
                var templates = {},
                    templateElements = this._element().children("[data-options]");
                if (templateElements.length)
                    templateElements.each(function(index, element) {
                        element = $(element);
                        var templateOptions = getTemplateOptions(element);
                        if (!templateOptions.name)
                            throw Error("Template name was not specified");
                        templates[templateOptions.name] = new ui.Template(element.get(0))
                    });
                else
                    templates[ANONYMOUS_TEMPLATE_NAME] = new ui.Template(this._element().contents());
                this._templates = templates
            },
            _getTemplate: function(templateName) {
                var result = this._aquireTemplate.apply(this, arguments);
                if (!result && this._createdWithKo() && ui.defaultTemplate) {
                    result = ui.defaultTemplate(this.NAME);
                    if (!result)
                        throw Error("Template \"" + templateName + "\" was not found and no default template specified!");
                }
                return result
            },
            _aquireTemplate: function(templateName) {
                if ($.isFunction(templateName))
                    templateName = templateName.apply(this, $.makeArray(arguments).slice(1));
                return this._templates[templateName]
            }
        });
    ui.ContainerWidget = ContainerWidget
})(jQuery, DevExpress);

// Module core, file ui.template.js



// Module core, file ui.collectionContainerWidget.js

(function($, DX, undefined) {
    var ui = DX.ui;
    var CollectionContainerWidget = ui.ContainerWidget.inherit({
            _defaultOptions: function() {
                return $.extend(this.callBase(), {
                        items: [],
                        itemTemplate: "item",
                        itemRender: null,
                        itemClickAction: null,
                        itemRenderedAction: null,
                        noDataText: "No data to display",
                        dataSource: null
                    })
            },
            _init: function() {
                this.callBase();
                this._initDataSource();
                this._loadDataSource()
            },
            _optionChanged: function(name, value, prevValue) {
                switch (name) {
                    case"dataSource":
                        this._clean();
                        this._initDataSource();
                        this._loadDataSource();
                        return;
                    case"noDataText":
                        this._renderEmptyMessage();
                        return;
                    default:
                        this.callBase(name, value, prevValue)
                }
            },
            _clean: function() {
                this._itemContainer().empty()
            },
            _handleDataSourceChanged: function(items) {
                this.option("items", items);
                this._renderEmptyMessage()
            },
            _itemContainer: function() {
                return this._element()
            },
            _itemClass: DX.abstract,
            _itemSelector: function() {
                return "." + this._itemClass()
            },
            _itemDataKey: DX.abstract,
            _items: function() {
                return this._itemContainer().find(this._itemSelector())
            },
            _render: function() {
                this.callBase();
                this._attachClickEvent();
                this._renderItems()
            },
            _renderEmptyMessage: function() {
                var noDataText = this.option("noDataText"),
                    noDataTextElement = this._element().find(".dx-empty-message"),
                    items = this.option("items"),
                    itemExists = items && items.length;
                if (!noDataText || itemExists || this._dataSourceLoading)
                    noDataTextElement.remove();
                else {
                    if (!noDataTextElement.length)
                        noDataTextElement = $("<div />").addClass("dx-empty-message").appendTo(this._itemContainer());
                    noDataTextElement.text(noDataText)
                }
            },
            _attachClickEvent: function() {
                var self = this,
                    itemSelector = self._itemSelector();
                self._itemContainer().off("." + self.NAME, itemSelector).on(self._eventHelper.eventName("click"), itemSelector, $.proxy(self._handleItemClick, self))
            },
            _handleItemClick: function(e) {
                this._handleItemEvent(e, "itemClickAction")
            },
            _renderItems: function() {
                var items = this.option("items") || [];
                if (items.length)
                    $.each(items, $.proxy(this._renderItem, this));
                else
                    this._renderEmptyMessage()
            },
            _renderItem: function(index, item, container) {
                container = container || this._itemContainer();
                var itemRenderer = this.option("itemRender"),
                    itemTemplateName = this.option("itemTemplate"),
                    itemTemplate = this._getTemplate(item.template || itemTemplateName, index, item),
                    itemElement;
                var renderArgs = {
                        index: index,
                        item: item,
                        container: container
                    };
                if (itemRenderer)
                    itemElement = this._createItemByRenderer(itemRenderer, renderArgs);
                else if (itemTemplate)
                    itemElement = this._createItemByTemplate(itemTemplate, renderArgs);
                else
                    itemElement = this._createItemByRenderer(this._itemRenderDefault, renderArgs);
                itemElement.addClass(this._itemClass()).data(this._itemDataKey(), item);
                this._createActionByOption("itemRenderedAction", {element: this._element()})({
                    itemElement: itemElement,
                    itemData: item
                });
                return itemElement
            },
            _createItemByRenderer: function(itemRenderer, renderArgs) {
                var itemElement = $("<div />").appendTo(renderArgs.container);
                var rendererResult = itemRenderer.call(this, renderArgs.item, renderArgs.index, itemElement);
                if (rendererResult && itemElement[0] !== rendererResult[0])
                    itemElement.append(rendererResult);
                return itemElement
            },
            _createItemByTemplate: function(itemTemplate, renderArgs) {
                return itemTemplate.render(renderArgs.container, renderArgs.item)
            },
            _itemRenderDefault: function(item, index, itemElement) {
                if ($.isPlainObject(item)) {
                    if (item.visible !== undefined && !item.visible)
                        itemElement.hide();
                    if (item.disabled)
                        itemElement.addClass("dx-state-disabled");
                    if (item.text)
                        itemElement.text(item.text);
                    if (item.html)
                        itemElement.html(item.html)
                }
                else
                    itemElement.html(String(item))
            },
            _handleItemEvent: function(jQueryEvent, handlerOptionName, args) {
                var itemElement = $(jQueryEvent.target).closest(this._itemSelector());
                var action = this._createActionByOption(handlerOptionName, {element: this._element()});
                var actionArgs = $.extend({
                        itemElement: itemElement,
                        itemData: itemElement.data(this._itemDataKey()),
                        jQueryEvent: jQueryEvent
                    }, args);
                return action(actionArgs)
            }
        }).include(ui.DataHelperMixin);
    ui.CollectionContainerWidget = CollectionContainerWidget
})(jQuery, DevExpress);

// Module core, file ui.optionsByDevice.js

(function($, DX, undefined) {
    DX.ui.optionsByDevice = function(device, componentName) {
        if (device.platform === "desktop") {
            switch (componentName) {
                case"dxScrollable":
                case"dxScrollView":
                    return {
                            scrollByContent: false,
                            showScrollbar: false
                        };
                case"dxList":
                    return {
                            scrollingEnabled: false,
                            showScrollbar: false,
                            autoPagingEnabled: false,
                            showNextButton: true
                        }
            }
            return {}
        }
        if (device.platform === "ios" && device.phone && componentName === "dxLookup")
            return {fullScreen: true};
        if (device.platform === "win8")
            if (componentName === "dxPopup")
                return {
                        width: "60%",
                        height: "auto"
                    };
        if (device.platform === "win8" || navigator.appName === "Microsoft Internet Explorer")
            if (componentName === "dxScrollable" || componentName === "dxScrollView")
                return {animationStrategy: "transition"};
        if (componentName === "dxDialog") {
            if (device.platform === "ios")
                return {width: 276};
            if (device.platform === "win8")
                return {width: "60%"};
            if (device.platform === "android")
                return {
                        lWidth: "60%",
                        pWidth: "80%"
                    }
        }
        if (componentName === "dxLookup")
            if (device.platform === "android")
                return {hideCancelButton: true}
    }
})(jQuery, DevExpress);


// Module widgets, file ui.swipeable.js

(function($, DX, undefined) {
    var ui = DX.ui,
        gestureUtils = ui.gestureUtils,
        DX_SWIPEABLE = "dxSwipeable",
        SWIPEABLE_CLASS = "dx-swipeable",
        STAGE_SLEEP = 0,
        STAGE_TOUCHED = 1,
        STAGE_SWIPING = 2,
        TICK_INTERVAL = 300,
        FAST_SWIPE_SPEED_LIMIT = 5,
        activeSwipeable,
        swipeStage = STAGE_SLEEP,
        touchX,
        touchY,
        touchTime,
        maxLeftOffset,
        maxRightOffset,
        moveX,
        tickX,
        tickTime,
        eventHelper = new ui.EventHelper(DX_SWIPEABLE);
    var reset = function() {
            activeSwipeable = null;
            swipeStage = STAGE_SLEEP
        };
    var closestSwipeable = function(e) {
            var current = $(e.target);
            while (current.length) {
                var swipeable = $(current).data(DX_SWIPEABLE);
                if (swipeable)
                    return swipeable;
                current = current.parent()
            }
        };
    var defaultItemWidthFunc = function(element) {
            return $(element).width()
        };
    var handleStart = function(e) {
            if (eventHelper.needSkipEvent(e))
                return;
            if (swipeStage > STAGE_SLEEP)
                return;
            activeSwipeable = closestSwipeable(e);
            if (!activeSwipeable)
                return;
            touchX = eventHelper.eventX(e);
            touchY = eventHelper.eventY(e);
            touchTime = e.timeStamp;
            tickTime = 0;
            swipeStage = STAGE_TOUCHED;
            if (eventHelper.isMouseEvent(e))
                e.preventDefault()
        };
    var handleMove = function(e) {
            if (!activeSwipeable || swipeStage === STAGE_SLEEP)
                return;
            gestureUtils.preventNativeElastic(e);
            if (swipeStage === STAGE_TOUCHED)
                handleFirstMove(e);
            if (swipeStage === STAGE_SWIPING)
                handleNextMoves(e)
        };
    var handleFirstMove = function(e) {
            var deltaX = eventHelper.eventX(e) - touchX,
                deltaY = eventHelper.eventY(e) - touchY;
            if (!deltaX && !deltaY)
                return;
            if (Math.abs(deltaY) >= Math.abs(deltaX) || eventHelper.needSkipEvent(e)) {
                reset();
                return
            }
            var startArgs = activeSwipeable._fireStart({jQueryEvent: e});
            if (startArgs.cancel) {
                activeSwipeable._fireCancel({jQueryEvent: e});
                reset();
                return
            }
            maxLeftOffset = startArgs.maxLeftOffset;
            maxRightOffset = startArgs.maxRightOffset;
            swipeStage = STAGE_SWIPING;
            gestureUtils.preventHangingCursor();
            gestureUtils.notifyStart()
        };
    var handleNextMoves = function(e) {
            moveX = eventHelper.eventX(e);
            var deltaX = moveX - touchX,
                offset = deltaX / activeSwipeable.itemWidthFunc();
            offset = fitOffset(offset, activeSwipeable.option("elastic"));
            if (e.timeStamp - tickTime > TICK_INTERVAL) {
                tickTime = e.timeStamp;
                tickX = eventHelper.eventX(e)
            }
            activeSwipeable._fireUpdate({
                offset: offset,
                jQueryEvent: e
            })
        };
    var handleEnd = function(e) {
            if (!window.tinyHippos && eventHelper.hasTouches(e) || !activeSwipeable)
                return;
            if (swipeStage !== STAGE_SWIPING) {
                reset();
                return
            }
            var offsetRatio = (moveX - touchX) / activeSwipeable.itemWidthFunc(),
                fast = FAST_SWIPE_SPEED_LIMIT * Math.abs(moveX - tickX) >= e.timeStamp - tickTime,
                startOffset = offsetRatio,
                targetOffset = calcTargetOffset(offsetRatio, fast);
            startOffset = fitOffset(startOffset, activeSwipeable.option("elastic"));
            targetOffset = fitOffset(targetOffset, false);
            activeSwipeable._fireEnd({
                offset: startOffset,
                targetOffset: targetOffset,
                jQueryEvent: e
            });
            gestureUtils.notifyEnd();
            reset()
        };
    var fitOffset = function(offset, elastic) {
            if (offset < -maxLeftOffset)
                return elastic ? (-2 * maxLeftOffset + offset) / 3 : -maxLeftOffset;
            if (offset > maxRightOffset)
                return elastic ? (2 * maxRightOffset + offset) / 3 : maxRightOffset;
            return offset
        };
    var calcTargetOffset = function(offsetRatio, fast) {
            var result;
            if (fast) {
                result = Math.ceil(Math.abs(offsetRatio));
                if (offsetRatio < 0)
                    result = -result
            }
            else
                result = Math.round(offsetRatio);
            return result
        };
    ui.registerComponent(DX_SWIPEABLE, ui.Component.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    elastic: true,
                    itemWidthFunc: defaultItemWidthFunc,
                    startAction: null,
                    updateAction: null,
                    endAction: null,
                    cancelAction: null
                })
        },
        _render: function() {
            this.callBase();
            this._createEventActions();
            this._element().addClass(SWIPEABLE_CLASS)
        },
        _createEventActions: function() {
            this._startAction = this._createActionByOption("startAction");
            this._updateAction = this._createActionByOption("updateAction");
            this._endAction = this._createActionByOption("endAction");
            this._cancelAction = this._createActionByOption("cancelAction")
        },
        _dispose: function() {
            this.callBase();
            if (activeSwipeable === this)
                reset()
        },
        itemWidthFunc: function() {
            return this.option("itemWidthFunc")(this._element())
        },
        _fireStart: function(e) {
            e = $.extend(e, {
                element: activeSwipeable._element()[0],
                maxLeftOffset: Number.POSITIVE_INFINITY,
                maxRightOffset: Number.POSITIVE_INFINITY,
                cancel: false
            });
            this._startAction(e);
            return e
        },
        _fireCancel: function(e) {
            this._cancelAction($.extend(e, {element: activeSwipeable._element()[0]}))
        },
        _fireUpdate: function(e) {
            this._updateAction($.extend(e, {element: activeSwipeable._element()[0]}))
        },
        _fireEnd: function(e) {
            this._endAction($.extend(e, {element: activeSwipeable._element()[0]}))
        }
    }));
    $(function() {
        var startAction = new DX.Action(handleStart, {context: ui.dxSwipeable}),
            moveAction = new DX.Action(handleMove, {context: ui.dxSwipeable}),
            endAction = new DX.Action(handleEnd, {context: ui.dxSwipeable});
        $(document).on(eventHelper.eventName("start"), $.proxy(startAction.execute, startAction)).on(eventHelper.eventName("move"), $.proxy(moveAction.execute, moveAction)).on(eventHelper.eventName("end") + " " + eventHelper.eventName("cancel"), $.proxy(endAction.execute, endAction))
    });
    ui.dxSwipeable.__internals = {
        state: function() {
            return swipeStage
        },
        STAGE_SLEEP: STAGE_SLEEP,
        STAGE_TOUCHED: STAGE_TOUCHED,
        STAGE_SWIPING: STAGE_SWIPING
    }
})(jQuery, DevExpress);

// Module widgets, file ui.scrollable.js

(function($, DX, undefined) {
    var ui = DX.ui,
        gestureUtils = ui.gestureUtils,
        feedback = ui.feedback,
        fx = DX.fx,
        translator = DX.translator,
        WHEEL = "mousewheel" in $.event.special;
    var math = Math,
        abs = math.abs;
    var DX_SCROLLABLE = "dxScrollable",
        INERTIA_EASING = "cubic-bezier(0.190, 1.000, 0.220, 1.000)",
        BOUNCE_EASING = "cubic-bezier(0.250, 0.460, 0.450, 0.940)",
        INERTIA_MODES = {
            normal: {
                duration: 2500,
                easing: INERTIA_EASING
            },
            bounceIn: {
                duration: 400,
                easing: BOUNCE_EASING
            },
            bounceOut: {
                duration: 100,
                easing: BOUNCE_EASING
            }
        },
        SCROLLABLE_CONTENT_CSS = "dx-scrollable-content",
        SCROLLABLE_CONTAINER_CSS = "dx-scrollable-container",
        SCROLLABLE_SCROLLBAR_CSS = "dx-scrollable-scrollbar",
        SCROLLABLE_SCROLL_CSS = "dx-scrollable-scroll",
        SCROLL_OPACITY = 0.9,
        SCROLL_FADE_DURATION = 300,
        SCROLL_BLINK_TIMEOUT = 1000,
        SCROLL_MIN_SIZE = 15,
        WHEEL_VELOCITY = 100,
        VELOCITY_CALC_TIMEOUT = 200,
        INERTION_CALC_TIMEOUT = 100,
        INERTION_DURATION = 400,
        INERTION_ANIM_DURATION = 2500,
        INERTION_MIN_VELOCITY = 0.2,
        BOUNCE_ANIM_DURATION = 400,
        BOUNCE_DECELERATION = 0.05,
        ELASTIC_RATE = 0.5,
        MAX_BOUNCE = 70,
        PROCESS_MOVE_INTERVAL = 20;
    var scrollHandled = false;
    var inRange = function(val, min, max) {
            if (val < min)
                return false;
            return val <= max
        };
    var limitRange = function(val, min, max) {
            if (val < min)
                return min;
            if (val > max)
                return max;
            return val
        };
    ui.registerComponent("dxScrollbar", ui.Widget.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {direction: "vertical"})
        },
        _init: function() {
            this.callBase();
            this._element().on("touchmove", function(e) {
                e.preventDefault()
            });
            this._blinkTimeout = null;
            this._contentSize = 0;
            this._containerSize = 0
        },
        _render: function() {
            this.callBase();
            this._element().addClass(SCROLLABLE_SCROLLBAR_CSS);
            this._scroll = $("<div />").addClass(SCROLLABLE_SCROLL_CSS).css("opacity", 0).appendTo(this._element());
            this._setDirection()
        },
        _setDirection: function() {
            this._directionHelper = this.option("direction") === "horizontal" ? {
                offsetProp: "left",
                sizeMethod: "width"
            } : {
                offsetProp: "top",
                sizeMethod: "height"
            };
            this._element().toggleClass(SCROLLABLE_SCROLLBAR_CSS + "-vertical", this.option("direction") === "vertical");
            this._element().toggleClass(SCROLLABLE_SCROLLBAR_CSS + "-horizontal", this.option("direction") === "horizontal")
        },
        _calcScrollOffset: function(contentOffset) {
            return -contentOffset / this._contentSize * this._containerSize
        },
        _dispose: function() {
            clearTimeout(this._blinkTimeout);
            this.callBase()
        },
        _optionChanged: function(name) {
            if (name === "direction")
                this._setDirection();
            this.callBase.apply(this, arguments)
        },
        update: function(contentSize, containerSize) {
            this._contentSize = contentSize;
            this._containerSize = containerSize;
            this._element()[this._directionHelper.sizeMethod](containerSize);
            var scrollSize = contentSize > containerSize ? containerSize * containerSize / contentSize : containerSize;
            this._scroll[this._directionHelper.sizeMethod](math.max(scrollSize, SCROLL_MIN_SIZE))
        },
        animate: function(contentOffset, config) {
            var deferred = $.Deferred();
            config = $.extend({to: {}}, config);
            config.to[this._directionHelper.offsetProp] = this._calcScrollOffset(contentOffset);
            fx.animate(this._scroll, config).done(function() {
                deferred.resolveWith(this)
            });
            return deferred.promise()
        },
        arrange: function(contentOffset) {
            var offset = {};
            offset[this._directionHelper.offsetProp] = this._calcScrollOffset(contentOffset);
            translator.move(this._scroll, offset)
        },
        toggle: function(showOrHide, doAnimate) {
            var deferred = $.Deferred(),
                opacity = SCROLL_OPACITY * !!showOrHide;
            clearTimeout(this._blinkTimeout);
            this.stop();
            if (!doAnimate || !this.option("visible") || this.option("disabled")) {
                this._scroll.css("opacity", opacity);
                return deferred.resolveWith(this).promise()
            }
            fx.animate(this._scroll, {
                to: {opacity: opacity},
                duration: SCROLL_FADE_DURATION
            }).done(function() {
                deferred.resolveWith(this)
            });
            return deferred.promise()
        },
        blink: function(doAnimate) {
            var self = this,
                deferred = $.Deferred(),
                showDeferred,
                hideDeferred = $.Deferred();
            showDeferred = self.toggle(true, doAnimate);
            self._blinkTimeout = setTimeout(function() {
                self.toggle(false, doAnimate).done(function() {
                    hideDeferred.resolve()
                })
            }, SCROLL_BLINK_TIMEOUT);
            $.when(showDeferred, hideDeferred).then(function() {
                deferred.resolveWith(self)
            });
            return deferred.promise()
        },
        scrollElement: function() {
            return this._scroll
        },
        stop: function(jumpToEnd) {
            fx.stop(this._scroll, jumpToEnd)
        }
    }));
    ui.registerComponent(DX_SCROLLABLE, ui.Component.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    animationEnabled: true,
                    inertiaEnabled: true,
                    scrollByContent: true,
                    scrollByThumb: false,
                    showScrollbar: true,
                    bounceEnabled: true,
                    direction: "vertical",
                    startAction: null,
                    scrollAction: null,
                    stopAction: null,
                    endAction: null,
                    inertiaAction: null,
                    animationStrategy: "frame"
                })
        },
        _init: function() {
            this.callBase();
            this._allowUpdate = true;
            this._lastEventData = null;
            this._prevEventData = null;
            this._contentOffset = {
                top: 0,
                left: 0
            };
            this._contentSize = {
                width: 0,
                height: 0
            };
            this._containerSize = {
                width: 0,
                height: 0
            };
            this._nowScrolling = false;
            this._movingScrollbar = undefined;
            this._lastMoveEvent = undefined
        },
        _render: function() {
            this.callBase();
            var $horizontalScrollbar = $("<div />").dxScrollbar({direction: "horizontal"}),
                $verticalScrollbar = $("<div />").dxScrollbar({direction: "vertical"});
            this._scrollbars = {
                x: $horizontalScrollbar.data("dxScrollbar"),
                y: $verticalScrollbar.data("dxScrollbar")
            };
            this._content = $("<div />").addClass(SCROLLABLE_CONTENT_CSS);
            this._container = this._content.wrap($("<div />").addClass(SCROLLABLE_CONTAINER_CSS)).parent().append($horizontalScrollbar).append($verticalScrollbar);
            this._directionChanged();
            this._scrollbarsEnabling();
            this._scrollByChanged();
            var rootElement = this._element();
            rootElement.addClass("dx-scrollable");
            if (!(navigator.platform.indexOf('Mac') > -1 && DevExpress.browser['webkit']))
                rootElement.addClass("dx-scrollable-customizable-scrollbars");
            this._content.append(rootElement.contents());
            this._container.appendTo(rootElement);
            this._afterRender()
        },
        _refresh: function() {
            this._detachStartHandlers();
            this._attachStartHandlers()
        },
        _directionChanged: function() {
            if ($.inArray(this.option("direction"), ["vertical", "horizontal", "both"]) < 0)
                this.option("direction", "vertical");
            this._content.toggleClass(SCROLLABLE_CONTENT_CSS + "-horizontal", this.option("direction") !== "vertical")
        },
        _scrollbarsEnabling: function() {
            this._scrollbars.x.option("visible", this.option("showScrollbar") && !this.option("disabled") && this.option("direction") !== "vertical");
            this._scrollbars.y.option("visible", this.option("showScrollbar") && !this.option("disabled") && this.option("direction") !== "horizontal")
        },
        _scrollByChanged: function() {
            var $scrollElements = $([this._scrollbars.x.scrollElement().get(0), this._scrollbars.y.scrollElement().get(0)]);
            this._startTarget = this.option("scrollByContent") ? this._container : $scrollElements;
            $scrollElements.css("cursor", this.option("scrollByThumb") ? "pointer" : "auto")
        },
        _afterRender: function() {
            this._afterRenderHandler()
        },
        _afterRenderHandler: function() {
            this._createEventActions();
            this._updateIfResized(false);
            this._attachStartHandlers();
            this._toggleWindowResizeHandler(true);
            this._scrollbarInitAction()
        },
        _scrollbarInitAction: function() {
            if (this.option("scrollByThumb")) {
                this._scrollbars.x.toggle(true);
                this._scrollbars.y.toggle(true)
            }
            else {
                this._scrollbars.x.blink(this.option("animationEnabled"));
                this._scrollbars.y.blink(this.option("animationEnabled"))
            }
        },
        _createEventActions: function() {
            this._startAction = this._createActionByOption("startAction");
            this._inertiaAction = this._createActionByOption("inertiaAction");
            this._scrollAction = this._createActionByOption("scrollAction");
            this._stopAction = this._createActionByOption("stopAction");
            this._endAction = this._createActionByOption("endAction")
        },
        _toggleWindowResizeHandler: function(onOff) {
            var callback = $.proxy(this.update, this);
            DX.utils.windowResizeCallbacks[onOff ? "add" : "remove"](callback)
        },
        _attachStartHandlers: function() {
            var eventHelper = this._eventHelper,
                actionStart = new DX.Action(this._handleStart, {context: this}),
                actionWheel = new DX.Action(this._handleWheel, {context: this}),
                actionNativeScroll = new DX.Action(this._handleNativeScroll, {context: this});
            this._startTarget.on(eventHelper.eventName("start"), $.proxy(actionStart.execute, actionStart));
            this._container.on(eventHelper.eventName("scroll"), $.proxy(actionNativeScroll.execute, actionNativeScroll));
            if (WHEEL)
                this._container.on(eventHelper.eventName("wheel"), $.proxy(actionWheel.execute, actionWheel))
        },
        _detachStartHandlers: function() {
            var eventHelper = this._eventHelper;
            this._startTarget.off(eventHelper.eventName("start"));
            this._container.on(eventHelper.eventName("scroll"));
            if (WHEEL)
                this._container.off(eventHelper.eventName("wheel"))
        },
        _handleStart: function(e) {
            var eventHelper = this._eventHelper;
            this._currentEvent = e;
            if (this.option("disabled") || eventHelper.needSkipEvent(e))
                return;
            if (scrollHandled)
                return;
            scrollHandled = true;
            if (eventHelper.isMouseEvent(e))
                e.preventDefault();
            this._fixDirection(e.target);
            this._lastEventData = this._prevEventData = eventHelper.eventData(e);
            this._stopScrolling();
            this._updateIfResized(true);
            this._attachScrollHandlers()
        },
        _updateIfResized: function(doAnimate) {
            if (!this._allowUpdate || this.option("disabled"))
                return;
            if (this._resized())
                this.update(doAnimate)
        },
        _resized: function() {
            return this._sizeChanged("width") || this._sizeChanged("height")
        },
        _sizeChanged: function(prop) {
            var contentSize = this._content[prop](),
                containerSize = this._container[prop]();
            if (!contentSize)
                return false;
            return contentSize !== this._contentSize[prop] || containerSize !== this._containerSize[prop]
        },
        _fixDirection: function(target) {
            var scrollbar = $(target).parent("." + SCROLLABLE_SCROLLBAR_CSS).data("dxScrollbar");
            this._movingScrollbar = this.option("scrollByThumb") && scrollbar ? scrollbar.option("direction") : undefined
        },
        _stopScrolling: function(jumpToEnd) {
            if (fx.animating(this._content)) {
                fx.stop(this._content, jumpToEnd);
                if (!jumpToEnd)
                    this._contentOffset = translator.locate(this._content);
                this._fireScrollStop()
            }
            this._scrollbars.x.stop(jumpToEnd);
            this._scrollbars.y.stop(jumpToEnd)
        },
        _attachScrollHandlers: function() {
            var eventHelper = this._eventHelper,
                actionFirstMove = new DX.Action(this._handleFirstMove, {context: this}),
                actionEnd = new DX.Action(this._handleEnd, {context: this});
            $(document).on(eventHelper.eventName("move") + ".dxFirstmove", $.proxy(actionFirstMove.execute, actionFirstMove)).on(eventHelper.eventName("end"), $.proxy(actionEnd.execute, actionEnd));
            if (eventHelper.eventName("cancel"))
                $(document).on(eventHelper.eventName("cancel"), $.proxy(actionEnd.execute, actionEnd))
        },
        _detachScrollHandlers: function() {
            var eventHelper = this._eventHelper;
            $(document).off(eventHelper.eventName("move")).off(eventHelper.eventName("end"));
            if (eventHelper.eventName("cancel"))
                $(document).off(eventHelper.eventName("cancel"))
        },
        _handleFirstMove: function(e) {
            this._currentEvent = e;
            var eventHelper = this._eventHelper,
                eventData = eventHelper.eventData(e),
                delta = eventHelper.eventDelta(this._lastEventData, eventData);
            this._allowUpdate = false;
            if (abs(delta.x) + abs(delta.y) === 0)
                return;
            $(document).off(eventHelper.eventName("move") + ".dxFirstmove");
            if (this._skipEventByDirection(delta))
                return;
            delta = this._ignoreLockedDirection(delta);
            this._lastMoveEvent = undefined;
            this._processMove();
            this._nowScrolling = true;
            this._startGesture(e);
            this._prevEventData = this._lastEventData;
            this._lastEventData = eventData;
            this._fireScrollStart();
            this._scrollbars.x.toggle(true);
            this._scrollbars.y.toggle(true);
            this._moveContent(delta);
            var actionMove = new DX.Action(this._handleMove, {context: this});
            $(document).on(eventHelper.eventName("move"), $.proxy(actionMove.execute, actionMove))
        },
        _skipEventByDirection: function(delta) {
            if (this._movingScrollbar)
                return false;
            if (this.option("direction") === "vertical" && abs(delta.x) >= abs(delta.y))
                return true;
            return this.option("direction") === "horizontal" && abs(delta.x) <= abs(delta.y)
        },
        _ignoreLockedDirection: function(delta) {
            if (this.option("direction") === "vertical" || this._movingScrollbar === "vertical")
                delta.x = 0;
            if (this.option("direction") === "horizontal" || this._movingScrollbar === "horizontal")
                delta.y = 0;
            return delta
        },
        _startGesture: function(e) {
            gestureUtils.preventHangingCursor();
            gestureUtils.preventNativeElastic(e);
            gestureUtils.notifyStart();
            feedback.lock()
        },
        _processMove: function(stop) {
            if (this._lastMoveEvent)
                this._handleLastMoveEvent();
            if (stop)
                clearTimeout(this._processMoveTimer);
            else
                this._processMoveTimer = setTimeout($.proxy(this._processMove, this), PROCESS_MOVE_INTERVAL)
        },
        _handleMove: function(e) {
            this._lastMoveEvent = e;
            gestureUtils.preventNativeElastic(e)
        },
        _handleLastMoveEvent: function() {
            var eventHelper = this._eventHelper,
                eventData = eventHelper.eventData(this._lastMoveEvent),
                delta = eventHelper.eventDelta(this._lastEventData, eventData);
            this._currentEvent = this._lastMoveEvent;
            this._lastMoveEvent = undefined;
            delta = this._ignoreLockedDirection(delta);
            this._moveContent(delta);
            var timeElapsed = eventHelper.eventDelta(this._prevEventData, this._lastEventData).time;
            if (timeElapsed > VELOCITY_CALC_TIMEOUT)
                this._prevEventData = this._lastEventData;
            this._lastEventData = eventData
        },
        _handleEnd: function(e) {
            this._processMove(true);
            this._currentEvent = e;
            this._detachScrollHandlers();
            scrollHandled = false;
            if (!this._nowScrolling) {
                this._bounceContent();
                return
            }
            this._nowScrolling = false;
            this._scrollContent(this._inertionOffset(e), true, !this._inBounds())
        },
        _inertionOffset: function(e) {
            var eventHelper = this._eventHelper,
                delta = eventHelper.eventDelta(this._prevEventData, this._lastEventData),
                endEventData = eventHelper.eventData(e),
                timeElapsed = eventHelper.eventDelta(this._lastEventData, endEventData).time,
                newOffset = $.extend({}, this._contentOffset);
            if (this.option("inertiaEnabled") && timeElapsed < INERTION_CALC_TIMEOUT) {
                delta = this._ignoreLockedDirection(delta);
                newOffset.left += this._inertionDistance(delta.x, delta.time);
                newOffset.top += this._inertionDistance(delta.y, delta.time)
            }
            return newOffset
        },
        _inertionDistance: function(deltaDistance, deltaTime) {
            var reverseModifier = this._movingScrollbar ? -1 : 1,
                deltaDistance = deltaDistance * reverseModifier,
                velocity = deltaDistance / deltaTime || 0,
                doInertion = abs(velocity) > INERTION_MIN_VELOCITY,
                distance = velocity * (doInertion ? INERTION_DURATION : 0);
            return distance
        },
        _handleWheel: function(e, delta) {
            this._currentEvent = e;
            if (this.option("disabled") || this.option("direction") === "horizontal")
                return;
            if (WHEEL) {
                this._allowUpdate = false;
                this._stopScrolling();
                this._updateIfResized(true);
                this._scrollbars.x.toggle(true);
                this._scrollbars.y.toggle(true);
                var newOffset = $.extend({}, this._contentOffset);
                newOffset.top = this._contentOffset.top + delta * WHEEL_VELOCITY;
                this._scrollContent(newOffset, false)
            }
            e.preventDefault()
        },
        _handleNativeScroll: function(e) {
            var scrollOffset = {
                    top: this._container.get(0).scrollTop,
                    left: this._container.get(0).scrollLeft
                },
                min;
            this._refreshSizes();
            min = this._minLimit();
            this._scrollAction({
                jQueryEvent: e,
                scrollOffset: scrollOffset,
                reachedLeft: scrollOffset.left === 0,
                reachedRight: scrollOffset.left === -min.left,
                reachedTop: scrollOffset.top === 0,
                reachedBottom: scrollOffset.top === -min.top
            })
        },
        _refreshSizes: function() {
            this._contentSize = {
                width: this._content.width(),
                height: this._content.height()
            };
            this._containerSize = {
                width: this._container.width(),
                height: this._container.height()
            }
        },
        _moveContent: function(delta) {
            if (this._movingScrollbar)
                delta = {
                    x: -delta.x * this._content.width() / this._container.width(),
                    y: -delta.y * this._content.height() / this._container.height()
                };
            else
                delta = {
                    x: delta.x * (this._inBounds() || ELASTIC_RATE),
                    y: delta.y * (this._inBounds() || ELASTIC_RATE)
                };
            this._contentOffset.left += delta.x;
            this._contentOffset.top += delta.y;
            if (!this.option("bounceEnabled"))
                this._contentOffset = this._limitedOffset();
            this._arrangeContent()
        },
        _scrollContent: function(newOffset, doAnimate, isBounce, updating) {
            doAnimate = this.option("animationEnabled") && doAnimate && (this._inBounds() || isBounce);
            newOffset = this._calcOffset(newOffset);
            if (this._contentOffset.left === newOffset.left && this._contentOffset.top === newOffset.top)
                return this._scrollComplete(updating);
            this._contentOffset = newOffset;
            if (!this.option("bounceEnabled"))
                this._contentOffset = this._limitedOffset();
            if (!isBounce)
                this._fireInertia();
            var mode = !this._inBounds() ? "bounceOut" : isBounce ? "bounceIn" : "normal";
            if (doAnimate)
                return this._animateContent(mode, updating);
            this._arrangeContent(updating);
            return this._scrollComplete(updating)
        },
        _calcOffset: function(newOffset) {
            var min = this._minLimit(),
                max = this._maxLimit(),
                offset = this._contentOffset,
                distance = newOffset - offset;
            return {
                    left: this._offsetByDirection(offset.left, newOffset.left, min.left, max.left),
                    top: this._offsetByDirection(offset.top, newOffset.top, min.top, max.top)
                }
        },
        _arrangeContent: function(updating) {
            translator.move(this._content, this._contentOffset);
            this._arrangeScrollbars(this._contentOffset);
            this._fireScroll(updating)
        },
        _animateContent: function(mode, updating) {
            var self = this,
                deferred = $.Deferred(),
                contentAnimDeferred = $.Deferred(),
                scrollbarsAnimDeferred,
                config = {
                    type: "slide",
                    strategy: self.option("animationStrategy"),
                    duration: INERTIA_MODES[mode].duration,
                    easing: INERTIA_MODES[mode].easing
                };
            fx.animate(self._content, $.extend({
                to: $.extend({}, self._contentOffset),
                complete: function() {
                    self._animationComplete(updating).done(function() {
                        contentAnimDeferred.resolve()
                    })
                }
            }, config));
            scrollbarsAnimDeferred = self._animateScrollbars(self._contentOffset, config);
            $.when(contentAnimDeferred, scrollbarsAnimDeferred).then(function() {
                deferred.resolveWith(self)
            });
            return deferred.promise()
        },
        _animationComplete: function(updating) {
            this._fireScroll(updating);
            return this._scrollComplete(updating)
        },
        _scrollComplete: function(updating) {
            this._fireScrollStop(updating);
            if (this._inBounds())
                this._fireScrollEnd(updating);
            return this._bounceContent(updating)
        },
        _bounceContent: function(updating) {
            if (this._inBounds()) {
                if (!this.option("scrollByThumb")) {
                    this._scrollbars.x.toggle(false, this.option("animationEnabled"));
                    this._scrollbars.y.toggle(false, this.option("animationEnabled"))
                }
                feedback.unlock();
                gestureUtils.notifyEnd();
                this._allowUpdate = true;
                return $.Deferred().resolveWith(this).promise()
            }
            return this._scrollContent(this._limitedOffset(), true, true, updating)
        },
        _arrangeScrollbars: function(contentOffset) {
            this._scrollbars.x.arrange(contentOffset.left);
            this._scrollbars.y.arrange(contentOffset.top)
        },
        _animateScrollbars: function(contentOffset, config) {
            return $.when(this._scrollbars.x.animate(contentOffset.left, config), this._scrollbars.y.animate(contentOffset.top, config))
        },
        _inBounds: function() {
            return (this.option("direction") === "vertical" || inRange(this._contentOffset.left, this._minLimit().left, this._maxLimit().left)) && (this.option("direction") === "horizontal" || inRange(this._contentOffset.top, this._minLimit().top, this._maxLimit().top))
        },
        _offsetByDirection: function(offset, newOffset, min, max) {
            var distance = newOffset - offset;
            if (!inRange(newOffset, min, max)) {
                newOffset = offset + distance * BOUNCE_DECELERATION;
                if (inRange(newOffset, min - MAX_BOUNCE, max + MAX_BOUNCE))
                    newOffset = limitRange(offset + distance, min - MAX_BOUNCE, max + MAX_BOUNCE)
            }
            return newOffset
        },
        _limitedOffset: function() {
            return {
                    left: limitRange(this._contentOffset.left, this._minLimit().left, this._maxLimit().left),
                    top: limitRange(this._contentOffset.top, this._minLimit().top, this._maxLimit().top)
                }
        },
        _maxLimit: function() {
            return {
                    left: 0,
                    top: 0
                }
        },
        _minLimit: function() {
            return {
                    left: math.min(this._containerSize.width - this._contentSize.width, 0),
                    top: math.min(this._containerSize.height - this._contentSize.height, 0)
                }
        },
        _fireScrollStart: function() {
            this._startAction(this._createEventArgs())
        },
        _fireInertia: function(animation, bouncing) {
            this._inertiaAction(this._createEventArgs())
        },
        _fireScroll: function(updating) {
            this._scrollAction($.extend(this._createEventArgs(), {updating: updating}))
        },
        _fireScrollStop: function(updating) {
            this._stopAction($.extend(this._createEventArgs(), {updating: updating}))
        },
        _fireScrollEnd: function(updating) {
            this._endAction($.extend(this._createEventArgs(), {updating: updating}))
        },
        _createEventArgs: function() {
            return {
                    jQueryEvent: this._currentEvent,
                    scrollOffset: {
                        top: -this._contentOffset.top,
                        left: -this._contentOffset.left
                    },
                    reachedLeft: this._reachedLeft(),
                    reachedRight: this._reachedRight(),
                    reachedTop: this._reachedTop(),
                    reachedBottom: this._reachedBottom()
                }
        },
        _reachedLeft: function() {
            return this._contentOffset.left >= this._maxLimit().left
        },
        _reachedTop: function() {
            return this._contentOffset.top >= this._maxLimit().top
        },
        _reachedRight: function() {
            var minLimit = this._minLimit();
            return minLimit.left && this._contentOffset.left <= minLimit.left
        },
        _reachedBottom: function() {
            var minLimit = this._minLimit();
            return minLimit.top && this._contentOffset.top <= minLimit.top
        },
        _dispose: function() {
            clearTimeout(this._processMoveTimer);
            this._detachStartHandlers();
            this._detachScrollHandlers();
            this._toggleWindowResizeHandler(false);
            this.callBase()
        },
        _optionChanged: function(name, value) {
            switch (name) {
                case"showScrollbar":
                    this._scrollbarsEnabling();
                    break;
                case"direction":
                    this._directionChanged();
                    break;
                case"disabled":
                    if (!this.option("disabled")) {
                        this._stopScrolling();
                        this.update(true)
                    }
                    this._scrollbarsEnabling();
                    break;
                case"scrollByContent":
                case"scrollByThumb":
                    this._detachStartHandlers();
                    this._scrollByChanged();
                    this._scrollbarInitAction();
                    break;
                case"startAction":
                case"scrollAction":
                case"stopAction":
                case"endAction":
                case"inertiaAction":
                    this._createEventActions();
                    break
            }
            this.callBase.apply(this, arguments)
        },
        _normalizeDistance: function(distance) {
            if ($.isPlainObject(distance))
                return distance;
            return this.option("direction") === "horizontal" ? {x: distance} : {y: distance}
        },
        _positionToOffset: function(pos) {
            var offset = {};
            if (pos.x !== undefined)
                offset.left = -pos.x;
            if (pos.y !== undefined)
                offset.top = -pos.y;
            return offset
        },
        _startScroll: function() {
            this._stopScrolling();
            this._updateIfResized(true);
            this._allowUpdate = false;
            this._fireScrollStart()
        },
        _updateScrollbars: function(contentSize, containerSize) {
            this._scrollbars.x.option("disabled", contentSize.width <= containerSize.width);
            this._scrollbars.x.update(contentSize.width, containerSize.width);
            this._scrollbars.y.option("disabled", contentSize.height <= containerSize.height);
            this._scrollbars.y.update(contentSize.height, containerSize.height)
        },
        _update: function(doAnimate) {
            if (this._inBounds()) {
                this._arrangeScrollbars(this._limitedOffset());
                return $.Deferred().resolveWith(this).promise()
            }
            this._scrollbars.x.toggle(true);
            this._scrollbars.y.toggle(true);
            return this._scrollContent(this._limitedOffset(), doAnimate, doAnimate, true)
        },
        update: function(doAnimate) {
            if (this.option("disabled"))
                return $.Deferred().resolveWith(this).promise();
            return DX.utils.executeAsync(function() {
                    this._refreshSizes();
                    this._updateScrollbars(this._contentSize, this._containerSize);
                    return this._update(doAnimate)
                }, this)
        },
        content: function() {
            return this._content
        },
        scrollTo: function(pos, doAnimate) {
            var newOffset;
            this._startScroll();
            newOffset = $.extend({}, this._contentOffset);
            pos = this._normalizeDistance(pos);
            return this._scrollContent(this._positionToOffset(pos), doAnimate)
        },
        scrollBy: function(distance, doAnimate) {
            var pos;
            this._startScroll();
            distance = this._normalizeDistance(distance);
            pos = {
                left: this._contentOffset.left - ~~distance.x,
                top: this._contentOffset.top - ~~distance.y
            };
            return this._scrollContent(pos, doAnimate)
        },
        scrollPos: function(pos) {
            this._stopScrolling();
            pos = this._normalizeDistance(pos);
            $.extend(this._contentOffset, this._positionToOffset(pos));
            this._arrangeContent()
        },
        stop: function(jumpToEnd) {
            this._stopScrolling(jumpToEnd);
            return this._bounceContent()
        }
    }));
    $.extend(ui.dxScrollable, {
        wheelSupport: function(value) {
            if (!arguments.length)
                return WHEEL;
            WHEEL = value
        },
        INERTION_CALC_TIMEOUT: INERTION_CALC_TIMEOUT,
        INERTION_MIN_VELOCITY: INERTION_MIN_VELOCITY,
        VELOCITY_CALC_TIMEOUT: VELOCITY_CALC_TIMEOUT,
        WHEEL_VELOCITY: WHEEL_VELOCITY,
        SCROLL_BLINK_TIMEOUT: SCROLL_BLINK_TIMEOUT
    })
})(jQuery, DevExpress);

// Module widgets, file ui.scrollView.js

(function($, DX, undefined) {
    var ui = DX.ui;
    var SCROLLVIEW_CLASS = "dx-scrollview",
        SCROLLVIEW_CONTENT_CLASS = "dx-scrollview-content",
        SCROLLVIEW_TOP_POCKET_CLASS = SCROLLVIEW_CLASS + "-top-pocket",
        SCROLLVIEW_BOTTOM_POCKET_CLASS = SCROLLVIEW_CLASS + "-bottom-pocket",
        SCROLLVIEW_SCROLLBOTTOM_INDICATOR_CLASS = SCROLLVIEW_CLASS + "-indicator",
        SCROLLVIEW_SCROLLBOTTOM_CLASS = SCROLLVIEW_CLASS + "-scrollbottom",
        SCROLLVIEW_SCROLLBOTTOM_IMAGE_CLASS = SCROLLVIEW_SCROLLBOTTOM_CLASS + "-image",
        SCROLLVIEW_SCROLLBOTTOM_TEXT_CLASS = SCROLLVIEW_SCROLLBOTTOM_CLASS + "-text",
        SCROLLVIEW_SCROLLBOTTOM_LOADING_CLASS = SCROLLVIEW_SCROLLBOTTOM_CLASS + "-loading",
        SCROLLVIEW_SCROLLBOTTOM_END_CLASS = SCROLLVIEW_SCROLLBOTTOM_CLASS + "-end",
        SCROLLVIEW_SCROLLBOTTOM_INDICATOR_CLASS = SCROLLVIEW_SCROLLBOTTOM_CLASS + "-indicator",
        SCROLLVIEW_PULLDOWN_CLASS = SCROLLVIEW_CLASS + "-pull-down",
        SCROLLVIEW_PULLDOWN_IMAGE_CLASS = SCROLLVIEW_PULLDOWN_CLASS + "-image",
        SCROLLVIEW_PULLDOWN_TEXT_CLASS = SCROLLVIEW_PULLDOWN_CLASS + "-text",
        SCROLLVIEW_PULLDOWN_LOADING_CLASS = SCROLLVIEW_PULLDOWN_CLASS + "-loading",
        SCROLLVIEW_PULLDOWN_READY_CLASS = SCROLLVIEW_PULLDOWN_CLASS + "-ready",
        SCROLLVIEW_PULLDOWN_INDICATOR_CLASS = SCROLLVIEW_PULLDOWN_CLASS + "-indicator",
        RELEASE_TIMEOUT = 500;
    ui.registerComponent("dxScrollView", ui.dxScrollable.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    pullDownAction: null,
                    reachBottomAction: null,
                    updateAction: null
                })
        },
        _init: function() {
            this.callBase();
            this._topPocket = $("<div/>").addClass(SCROLLVIEW_TOP_POCKET_CLASS);
            this._bottomPocket = $("<div/>").addClass(SCROLLVIEW_BOTTOM_POCKET_CLASS);
            this._pullDown = $("<div/>").addClass(SCROLLVIEW_PULLDOWN_CLASS).appendTo(this._topPocket);
            $("<div />").addClass(SCROLLVIEW_PULLDOWN_IMAGE_CLASS).appendTo(this._pullDown);
            var loadIndicatorTop = $("<div>").dxLoadIndicator();
            $("<div>").addClass(SCROLLVIEW_PULLDOWN_INDICATOR_CLASS).append(loadIndicatorTop).appendTo(this._pullDown);
            this._pullDownText = $("<div />").addClass(SCROLLVIEW_PULLDOWN_TEXT_CLASS).text("Pull down to refresh...").appendTo(this._pullDown);
            this._scrollBottom = $("<div/>").addClass(SCROLLVIEW_SCROLLBOTTOM_CLASS).addClass(SCROLLVIEW_SCROLLBOTTOM_LOADING_CLASS).appendTo(this._bottomPocket);
            var loadIndicatorBottom = $("<div>").dxLoadIndicator();
            $("<div>").addClass(SCROLLVIEW_SCROLLBOTTOM_INDICATOR_CLASS).append(loadIndicatorBottom).appendTo(this._scrollBottom);
            this._scrollBottomText = $("<div>Loading...</div>").addClass(SCROLLVIEW_SCROLLBOTTOM_TEXT_CLASS).appendTo(this._scrollBottom);
            this._considerTopPocket = false;
            this._considerBottomPocket = false;
            this._startPullDown = false;
            this._pullDownInProcess = false;
            this._scrollBottomInProcess = false;
            this._preventScrollBottom = false;
            this._freezed = false;
            this._releaseTimer = null;
            this._pullDownLoadingState = false;
            this._refreshPullDown();
            this._refreshReachBottom()
        },
        _render: function() {
            this.callBase();
            this._element().addClass(SCROLLVIEW_CLASS);
            this._scrollViewContent = this._content.wrapInner($("<div />").addClass(SCROLLVIEW_CONTENT_CLASS)).children().before(this._topPocket).after(this._bottomPocket);
            this._afterRenderHandler()
        },
        _optionChanged: function(name) {
            this.callBase.apply(this, arguments);
            if (name === "pullDownAction")
                this._refreshPullDown();
            else if (name === "reachBottomAction")
                this._refreshReachBottom();
            this.update()
        },
        _refreshPullDown: function() {
            this._hasPullDown = !!this.option("pullDownAction") && this.option("direction") === "vertical" && !this.option("disabled");
            this._pullDown.toggle(this._hasPullDown);
            this._topPocketHeight = this._hasPullDown ? this._getHeight(this._topPocket) : 0
        },
        _refreshReachBottom: function() {
            this._hasScrollBottom = !!this.option("reachBottomAction") && this.option("direction") === "vertical" && !this.option("disabled");
            this._scrollBottom.toggle(this._hasScrollBottom);
            this._bottomPocketHeight = this._hasScrollBottom ? this._getHeight(this._bottomPocket) : 0
        },
        _afterRender: function(){},
        _getHeight: function(element) {
            var themeContainer = $("[class*=dx-theme-]"),
                container = $("<div/>").css({
                    visibility: "hidden",
                    position: "fixed",
                    right: -9999
                }).appendTo(themeContainer.length ? themeContainer : "body"),
                clone = element.clone().appendTo(container).show();
            var result = clone.height();
            container.remove();
            return result
        },
        _toggleScrollBottomState: function(preventScrollBottom) {
            if (this._hasScrollBottom) {
                this._bottomPocketHeight = preventScrollBottom ? 0 : this._getHeight(this._bottomPocket);
                this._scrollBottom.toggle(!preventScrollBottom)
            }
        },
        _togglePullDownState: function(showing) {
            this._pullDownLoadingState = false;
            this._pullDown.removeClass(SCROLLVIEW_PULLDOWN_LOADING_CLASS).toggleClass(SCROLLVIEW_PULLDOWN_READY_CLASS, showing);
            this._pullDownText.text(showing ? "Release to refresh..." : "Pull down to refresh...")
        },
        _setPullDownInProcess: function() {
            this._pullDownLoadingState = true;
            this._pullDown.removeClass(SCROLLVIEW_PULLDOWN_READY_CLASS).addClass(SCROLLVIEW_PULLDOWN_LOADING_CLASS);
            this._pullDownText.text('Refreshing...')
        },
        _fireScroll: function(updating) {
            this.callBase(updating);
            if (updating)
                return;
            this._handlePullDownScroll();
            this._handleScrollBottomScroll()
        },
        _fireScrollStop: function(updating) {
            this.callBase(updating);
            if (updating) {
                if (this._reachedPocketTop())
                    return;
                this._togglePullDownState(false);
                return
            }
            this._handlePullDownStop();
            this._handleScrollBottomStop()
        },
        _fireScrollEnd: function(updating) {
            this.callBase(updating);
            this._handlePullDownEnd()
        },
        _handlePullDownScroll: function() {
            if (!this._hasPullDown || this._pullDownInProcess || this._startPullDown)
                return;
            var reachedPocketTop = this._reachedPocketTop();
            if (this._considerTopPocket !== reachedPocketTop || this._pullDownLoadingState) {
                this._considerTopPocket = reachedPocketTop;
                this._togglePullDownState(reachedPocketTop)
            }
        },
        _handleScrollBottomScroll: function() {
            if (!this._hasScrollBottom || this._scrollBottomInProcess || this._preventScrollBottom)
                return;
            this._considerBottomPocket = this._reachedPocketBottom()
        },
        _handlePullDownStop: function() {
            if (this._pullDownInProcess)
                return;
            if (this._hasPullDown && this._reachedPocketTop()) {
                this._startPullDown = true;
                this._freezed = true;
                this._setPullDownInProcess()
            }
        },
        _handleScrollBottomStop: function() {
            if (this._scrollBottomInProcess || this._preventScrollBottom)
                return;
            if (this._hasScrollBottom && this._reachedPocketBottom())
                this._fireScrollBottom()
        },
        _handlePullDownEnd: function() {
            if (this._startPullDown)
                this._firePullDown()
        },
        _runReleaseTimer: function() {
            this._releaseTimerDeferred = $.Deferred();
            this._releaseTimer = setTimeout($.proxy(function() {
                this._releaseTimer = null;
                if (this._needToRelease)
                    this._doRelease().done(function() {
                        this._releaseTimerDeferred.resolve(this)
                    })
            }, this), RELEASE_TIMEOUT)
        },
        _firePullDown: function() {
            this._runReleaseTimer();
            this._pullDownInProcess = true;
            this._createActionByOption("pullDownAction")(this)
        },
        _fireScrollBottom: function() {
            this.update(true);
            this._freezed = true;
            this._scrollBottomInProcess = true;
            this._createActionByOption("reachBottomAction")(this)
        },
        _reachedPocketTop: function() {
            return this._contentOffset.top >= 0
        },
        _reachedPocketBottom: function() {
            var limitBottom = this._containerSize.height - this._contentSize.height;
            return limitBottom && this._contentOffset.top < limitBottom
        },
        _maxLimit: function() {
            if (this._considerTopPocket)
                return this.callBase();
            return {
                    left: 0,
                    top: -this._topPocketHeight
                }
        },
        _minLimit: function() {
            var result = this.callBase();
            if (this._containerSize.height > this._heightWithoutPockets())
                return this._maxLimit();
            var limitBottom = this._containerSize.height - this._contentSize.height;
            if (!this._considerBottomPocket || !this._hasScrollBottom)
                limitBottom += this._bottomPocketHeight;
            result.top = limitBottom;
            return result
        },
        _heightWithoutPockets: function() {
            var contentHeight = this._contentSize.height;
            if (!this._considerTopPocket)
                contentHeight -= this._topPocketHeight;
            if (!this._considerBottomPocket)
                contentHeight -= this._bottomPocketHeight;
            return contentHeight
        },
        _updateScrollbars: function(contentSize, containerSize) {
            var scrollViewContentSize = {
                    width: this._scrollViewContent.width(),
                    height: this._scrollViewContent.height()
                };
            this.callBase(scrollViewContentSize, containerSize)
        },
        _arrangeScrollbars: function(contentOffset) {
            this._scrollbars.x.arrange(contentOffset.left);
            this._scrollbars.y.arrange(contentOffset.top + this._topPocketHeight)
        },
        _animateScrollbars: function(contentOffset, config) {
            this._scrollbars.x.animate(contentOffset.left, config);
            this._scrollbars.y.animate(contentOffset.top + this._topPocketHeight, config)
        },
        _handleStart: function(e) {
            if (this._freezed)
                return;
            this.callBase(e)
        },
        _doRelease: function() {
            this._stopScrolling();
            this._needToRelease = false;
            this._toggleScrollBottomState(this._preventScrollBottom);
            this._startPullDown = false;
            this._pullDownInProcess = false;
            this._scrollBottomInProcess = false;
            this._considerTopPocket = false;
            this._considerBottomPocket = false;
            this._freezed = false;
            return this.update(true)
        },
        _dispose: function() {
            clearTimeout(this._releaseTimer);
            this.callBase()
        },
        update: function(doAnimate) {
            var promise;
            if (!this._freezed && !this.option("disabled"))
                promise = this.callBase(doAnimate);
            else
                promise = $.Deferred().resolveWith(this).promise();
            promise.done(function() {
                if (this.option("updateAction"))
                    this._createActionByOption("updateAction")(this)
            });
            return promise
        },
        content: function() {
            return this._scrollViewContent
        },
        isFull: function() {
            var elementSize = this._scrollViewContent.height();
            return !elementSize || elementSize >= this._containerSize.height
        },
        release: function(preventScrollBottom) {
            this._preventScrollBottom = !!preventScrollBottom;
            if (this._releaseTimer) {
                this._needToRelease = true;
                return this._releaseTimerDeferred.promise()
            }
            return DX.utils.executeAsync(this._doRelease, this)
        },
        toggleLoading: function(showOrHide) {
            this._scrollBottom.toggle(this._hasScrollBottom || showOrHide)
        }
    }))
})(jQuery, DevExpress);

// Module widgets, file ui.button.js

(function($, DX, undefined) {
    var ui = DX.ui;
    var BUTTON_CLASS = "dx-button",
        BUTTON_CONTENT_CLASS = "dx-button-content",
        BUTTON_CONTENT_SELECTOR = ".dx-button-content",
        BUTTON_TEXT_CLASS = "dx-button-text",
        BUTTON_TEXT_SELECTOR = ".dx-button-text",
        BUTTON_BACK_ARROW_CLASS = "dx-button-back-arrow",
        ICON_CLASS = "dx-icon",
        ICON_SELECTOR = ".dx-icon";
    ui.registerComponent("dxButton", ui.Widget.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    type: "normal",
                    text: "",
                    icon: "",
                    iconSrc: ""
                })
        },
        _render: function() {
            this.callBase();
            this._element().addClass(BUTTON_CLASS).append($("<div />").addClass(BUTTON_CONTENT_CLASS));
            this._renderIcon();
            this._renderType();
            this._renderText()
        },
        _renderIcon: function() {
            var contentElement = this._element().find(BUTTON_CONTENT_SELECTOR),
                iconElement = contentElement.find(ICON_SELECTOR),
                icon = this.option("icon"),
                iconSrc = this.option("iconSrc");
            iconElement.remove();
            if (this.option("type") === "back" && !icon)
                icon = "back";
            if (!icon && !iconSrc)
                return;
            if (icon)
                iconElement = $("<span />").addClass("dx-icon-" + icon);
            else if (iconSrc)
                iconElement = $("<img />").attr("src", iconSrc);
            contentElement.append(iconElement.addClass(ICON_CLASS))
        },
        _renderType: function() {
            var type = this.option("type");
            if (type)
                this._element().addClass("dx-button-" + type);
            if (type === "back")
                this._element().prepend($("<span />").addClass(BUTTON_BACK_ARROW_CLASS))
        },
        _renderText: function() {
            var text = this.option("text"),
                contentElement = this._element().find(BUTTON_CONTENT_SELECTOR),
                back = this.option("type") === "back";
            var textElement = contentElement.find(BUTTON_TEXT_SELECTOR);
            if (!text && !back) {
                textElement.remove();
                return
            }
            if (!textElement.length)
                textElement = $('<span />').addClass(BUTTON_TEXT_CLASS).appendTo(contentElement);
            textElement.text(text || "Back")
        },
        _optionChanged: function(name) {
            switch (name) {
                case"type":
                case"icon":
                case"iconSrc":
                    this._renderType();
                    this._renderIcon();
                    break;
                case"text":
                    this._renderText();
                    break;
                default:
                    this.callBase.apply(this, arguments)
            }
        }
    }))
})(jQuery, DevExpress);

// Module widgets, file ui.checkBox.js

(function($, DX, undefined) {
    var ui = DX.ui;
    var CHECKBOX_CLASS = "dx-checkbox",
        CHECKBOX_ICON_CLASS = "dx-checkbox-icon",
        CHECKBOX_CHECKED_CLASS = "dx-checkbox-checked";
    ui.registerComponent("dxCheckBox", ui.Widget.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {checked: false})
        },
        _render: function() {
            this.callBase();
            this._element().addClass(CHECKBOX_CLASS);
            $("<span />").addClass(CHECKBOX_ICON_CLASS).appendTo(this._element());
            this._renderValue()
        },
        _renderClick: function() {
            var eventName = this._eventHelper.eventName("click");
            this._element().off(eventName).on(eventName, $.proxy(this._handleClick, this))
        },
        _handleClick: function() {
            var self = this;
            this._createActionByOption("clickAction", {beforeExecute: function() {
                    self.option("checked", !self.option("checked"))
                }})()
        },
        _renderValue: function() {
            this._element().toggleClass(CHECKBOX_CHECKED_CLASS, this.option("checked"))
        },
        _refresh: function() {
            this._renderValue()
        }
    }))
})(jQuery, DevExpress);

// Module widgets, file ui.switch.js

(function($, DX, undefined) {
    var ui = DX.ui,
        fx = DX.fx;
    var SWITCH_CLASS = "dx-switch",
        SWITCH_WRAPPER_CLASS = SWITCH_CLASS + "-wrapper",
        SWITCH_INNER_CLASS = SWITCH_CLASS + "-inner",
        SWITCH_HANDLE_CLASS = SWITCH_CLASS + "-handle",
        SWITCH_ON_VALUE_CLASS = SWITCH_CLASS + "-on-value",
        SWITCH_ON_CLASS = SWITCH_CLASS + "-on",
        SWITCH_OFF_CLASS = SWITCH_CLASS + "-off",
        MARGIN_BOUND = 50,
        SWITCH_ANIMATION_DURATION = 100;
    ui.registerComponent("dxSwitch", ui.Widget.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    onText: "ON",
                    offText: "OFF",
                    value: false
                })
        },
        _init: function() {
            this.callBase();
            this._animating = false;
            this._animationDuration = SWITCH_ANIMATION_DURATION
        },
        _render: function() {
            this._switchInner = $("<div />").addClass(SWITCH_INNER_CLASS).append($("<div />").addClass(SWITCH_HANDLE_CLASS));
            this._labelOn = $("<div />").addClass(SWITCH_ON_CLASS).prependTo(this._switchInner);
            this._labelOff = $("<div />").addClass(SWITCH_OFF_CLASS).appendTo(this._switchInner);
            var $switchWrapper = $("<div />").addClass(SWITCH_WRAPPER_CLASS).append(this._switchInner);
            this._element().addClass(SWITCH_CLASS).append($switchWrapper).dxSwipeable({
                elastic: false,
                startAction: $.proxy(this._handleSwipeStart, this),
                updateAction: $.proxy(this._handleSwipeUpdate, this),
                endAction: $.proxy(this._handleSwipeEnd, this),
                itemWidthFunc: function() {
                    return MARGIN_BOUND + 1
                }
            });
            this._renderValue();
            this._renderLabels();
            this.callBase()
        },
        _renderPosition: function(state, swipeOffset) {
            var stateInt = state ? 1 : 0;
            this._switchInner.css("marginLeft", MARGIN_BOUND * (stateInt + swipeOffset - 1))
        },
        _validateValue: function() {
            var check = this.option("value");
            if (typeof check !== "boolean")
                this._options["value"] = !!check
        },
        _renderClick: function() {
            this.callBase();
            var eventName = this._eventHelper.eventName("click"),
                clickAction = this._createAction($.proxy(this._handleClick, this));
            this._element().on(eventName, function(e) {
                clickAction({jQueryEvent: e})
            })
        },
        _handleClick: function(args) {
            var self = args.component;
            if (self._animating || self._swiping)
                return;
            self._animating = true;
            var startValue = self.option("value"),
                endValue = !startValue;
            fx.animate(this._switchInner, {
                from: {marginLeft: (Number(startValue) - 1) * MARGIN_BOUND},
                to: {marginLeft: (Number(endValue) - 1) * MARGIN_BOUND},
                duration: self._animationDuration,
                complete: function() {
                    self._animating = false;
                    self.option("value", endValue)
                }
            })
        },
        _handleSwipeStart: function(e) {
            var state = this.option("value");
            e.maxLeftOffset = state ? 1 : 0;
            e.maxRightOffset = state ? 0 : 1;
            this._swiping = true
        },
        _handleSwipeUpdate: function(e) {
            this._renderPosition(this.option("value"), e.offset)
        },
        _handleSwipeEnd: function(e) {
            var self = this;
            fx.animate(this._switchInner, {
                to: {marginLeft: MARGIN_BOUND * (self.option("value") + e.targetOffset - 1)},
                duration: self._animationDuration,
                complete: function() {
                    self._swiping = false;
                    var pos = self.option("value") + e.targetOffset;
                    self.option("value", Boolean(pos))
                }
            })
        },
        _renderValue: function() {
            this._validateValue();
            var val = this.option("value");
            this._renderPosition(val, 0);
            this._element().toggleClass(SWITCH_ON_VALUE_CLASS, val)
        },
        _renderLabels: function() {
            this._labelOn.text(this.option("onText"));
            this._labelOff.text(this.option("offText"))
        },
        _optionChanged: function(name, value, prevValue) {
            switch (name) {
                case"value":
                    this._renderValue();
                    break;
                case"onText":
                case"offText":
                    this._renderLabels();
                    break;
                default:
                    this.callBase(name, value, prevValue)
            }
        },
        _feedbackOff: function(isGestureStart) {
            if (isGestureStart)
                return;
            this.callBase.apply(this, arguments)
        }
    }))
})(jQuery, DevExpress);

// Module widgets, file ui.editBox.js

(function($, DX, undefined) {
    var ui = DX.ui;
    var EDITBOX_CLASS = "dx-editbox",
        EDITBOX_INPUT_CLASS = "dx-editbox-input",
        EDITBOX_INPUT_SELECTOR = "." + EDITBOX_INPUT_CLASS,
        EDITBOX_BORDER_CLASS = "dx-editbox-border",
        EDITBOX_PLACEHOLDER_CLASS = "dx-placeholder",
        EVENTS_LIST = ["focusIn", "focusOut", "keyDown", "keyPress", "keyUp", "change"];
    var nativePlaceholderSupport = function() {
            var check = document.createElement("input");
            return "placeholder" in check
        }();
    ui.registerComponent("dxEditBox", ui.Widget.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    value: "",
                    valueUpdateEvent: "change",
                    valueUpdateAction: null,
                    placeholder: "",
                    readOnly: false,
                    focusInAction: null,
                    focusOutAction: null,
                    keyDownAction: null,
                    keyPressAction: null,
                    keyUpAction: null,
                    changeAction: null,
                    mode: "text"
                })
        },
        _input: function() {
            return this._element().find(EDITBOX_INPUT_SELECTOR)
        },
        _render: function() {
            this._element().addClass(EDITBOX_CLASS);
            this._renderInput();
            this._renderInputType();
            this._renderValue();
            this._renderProps();
            this._renderPlaceholder();
            this._renderEvents();
            this._renderEnterKeyAction();
            this.callBase()
        },
        _renderInput: function() {
            this._element().append($("<input />").addClass(EDITBOX_INPUT_CLASS)).append($("<div />").addClass(EDITBOX_BORDER_CLASS))
        },
        _renderValue: function() {
            if (this._input().val() !== this.option("value"))
                this._input().val(this.option("value"))
        },
        _renderProps: function() {
            this._input().prop({
                placeholder: this.option("placeholder"),
                readOnly: this.option("readOnly"),
                disabled: this.option("disabled")
            })
        },
        _renderPlaceholder: function() {
            if (nativePlaceholderSupport)
                return;
            var self = this,
                placeholderText = self.option("placeholder"),
                $input = self._input(),
                $placeholder = $('<div />').addClass(EDITBOX_PLACEHOLDER_CLASS).addClass("dx-hide").attr("data-dx_placeholder", placeholderText),
                startEvent = self._eventHelper.eventName("start");
            $placeholder.on(startEvent, function() {
                $input.focus()
            });
            $input.wrap($placeholder).on("focus.dxEditBox focusin.dxEditBox", function() {
                self._setStatePlaceholder.call(self, true)
            }).on("blur.dxEditBox focusout.dxEditBox", function() {
                self._setStatePlaceholder.call(self, false)
            });
            self._setStatePlaceholder()
        },
        _renderEvents: function() {
            var self = this,
                $input = self._input(),
                eventHelper = self._eventHelper;
            $.each(EVENTS_LIST, function(index, event) {
                var eventName = eventHelper.eventName(event.toLowerCase()),
                    action = self._createActionByOption(event + "Action");
                $input.off(eventName).on(eventName, function(e) {
                    action({jQueryEvent: e})
                })
            });
            self._renderValueUpdateEvent()
        },
        _renderValueUpdateEvent: function() {
            var valueUpdateEventName = this._eventHelper.eventName(this.option("valueUpdateEvent"));
            this._input().off("." + this.NAME, this._handleValueChange).on(valueUpdateEventName, $.proxy(this._handleValueChange, this));
            this._changeAction = this._createActionByOption("valueUpdateAction")
        },
        _setStatePlaceholder: function(state) {
            if (nativePlaceholderSupport)
                return;
            var $input = this._input(),
                $placeholder = $input.parent("." + EDITBOX_PLACEHOLDER_CLASS);
            if (typeof state === "undefined") {
                if ($input.val() === "" && !$input.prop("disabled") && $input.prop("placeholder"))
                    state = false;
                if (!!$input.val())
                    state = true
            }
            $placeholder.toggleClass("dx-hide", state)
        },
        _handleValueChange: function() {
            this.option("value", this._input().val())
        },
        _renderEnterKeyAction: function() {
            if (this.option("enterKeyAction")) {
                this._enterKeyAction = this._createActionByOption("enterKeyAction");
                this._input().on("keydown.enterKey.dxEditBox", $.proxy(this._onKeyDownHandler, this))
            }
            else {
                this._input().off("keydown.enterKey.dxEditBox");
                this._enterKeyAction = undefined
            }
        },
        _onKeyDownHandler: function(e) {
            if (e.which === 13)
                this._enterKeyAction()
        },
        _renderDisabledState: function() {
            this.callBase();
            this._renderProps()
        },
        _optionChanged: function(optionName, optionValue) {
            if ($.inArray(optionName.replace("Action", ""), EVENTS_LIST) > -1) {
                this._renderEvents();
                return
            }
            switch (optionName) {
                case"value":
                    this._renderValue();
                    this._setStatePlaceholder();
                    this._changeAction(optionValue);
                    break;
                case"valueUpdateEvent":
                case"valueUpdateAction":
                    this._renderValueUpdateEvent();
                    break;
                case"readOnly":
                    this._renderProps();
                    break;
                case"mode":
                    this._renderInputType();
                    break;
                case"enterKeyAction":
                    this._renderEnterKeyAction();
                    break;
                default:
                    this.callBase.apply(this, arguments)
            }
        },
        _renderInputType: function() {
            var input = this._input();
            try {
                input.prop("type", this.option("mode"))
            }
            catch(e) {
                input.prop("type", "text")
            }
        },
        focus: function() {
            this._input().trigger("focus")
        }
    }));
    ui.dxEditBox.__internals = {nativePlaceholderSupport: function(newState) {
            if (arguments.length)
                nativePlaceholderSupport = !!newState;
            return nativePlaceholderSupport
        }}
})(jQuery, DevExpress);

// Module widgets, file ui.textBox.js

(function($, DX, undefined) {
    var ui = DX.ui;
    var TEXTBOX_CLASS = "dx-textbox";
    var ignoreCode = [8, 9, 13, 33, 34, 35, 36, 37, 38, 39, 40, 46];
    ui.registerComponent("dxTextBox", ui.dxEditBox.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    mode: "text",
                    maxLength: null,
                    enterKeyAction: null
                })
        },
        _render: function() {
            this.callBase();
            this._element().addClass(TEXTBOX_CLASS);
            if (this._isAndroid())
                this._input().on(this._eventHelper.eventName("keydown"), $.proxy(this._onKeyDownAndroidHandler, this)).on(this._eventHelper.eventName("change"), $.proxy(this._onChangeAndroidHandler, this))
        },
        _renderProps: function() {
            this.callBase();
            if (this._isAndroid())
                return;
            var maxLength = this.option("maxLength");
            if (maxLength > 0)
                this._input().prop("maxLength", maxLength)
        },
        _optionChanged: function(name) {
            switch (name) {
                case"maxLength":
                    this._renderProps();
                    break;
                default:
                    this.callBase.apply(this, arguments)
            }
        },
        _onKeyDownAndroidHandler: function(e) {
            var maxLength = this.option("maxLength");
            if (maxLength) {
                var $input = $(e.target),
                    code = e.keyCode;
                this._cutOffExtraChar($input);
                return $input.val().length < maxLength || $.inArray(code, ignoreCode) !== -1 || window.getSelection().toString() !== ""
            }
            else
                return true
        },
        _onChangeAndroidHandler: function(e) {
            var $input = $(e.target);
            if (this.option("maxLength"))
                this._cutOffExtraChar($input)
        },
        _cutOffExtraChar: function($input) {
            var maxLength = this.option("maxLength"),
                textInput = $input.val();
            if (textInput.length > maxLength)
                $input.val(textInput.substr(0, maxLength))
        },
        _isAndroid: function() {
            var ua = window.navigator.userAgent,
                version = DX.devices.androidVersion(ua);
            return version && /^(2\.|4\.0|4\.1)/.test(version) && ua.indexOf("Chrome") === -1
        }
    }))
})(jQuery, DevExpress);

// Module widgets, file ui.textArea.js

(function($, DX, undefined) {
    var ui = DX.ui;
    var TEXTAREA_CLASS = "dx-textarea",
        EDITBOX_INPUT_CLASS = "dx-editbox-input",
        EDITBOX_BORDER_CLASS = "dx-editbox-border";
    ui.registerComponent("dxTextArea", ui.dxEditBox.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    cols: 20,
                    rows: 2
                })
        },
        _render: function() {
            this.callBase();
            this._element().addClass(TEXTAREA_CLASS)
        },
        _renderInput: function() {
            this._element().append($("<textarea>").addClass(EDITBOX_INPUT_CLASS)).append($("<div />").addClass(EDITBOX_BORDER_CLASS))
        },
        _renderInputType: $.noop,
        _renderProps: function() {
            this.callBase();
            this._input().prop({
                rows: this.option("rows"),
                cols: this.option("cols")
            })
        },
        _renderDimensions: function() {
            this.callBase();
            var width = this.option("width"),
                height = this.option("height");
            this._input().width(width);
            this._input().height(height)
        }
    }))
})(jQuery, DevExpress);

// Module widgets, file ui.numberBox.js

(function($, DX, undefined) {
    var ui = DX.ui,
        math = Math;
    ui.registerComponent("dxNumberBox", ui.dxEditBox.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    value: 0,
                    min: -Number.MAX_VALUE,
                    max: Number.MAX_VALUE,
                    mode: "number"
                })
        },
        _render: function() {
            this.callBase();
            this._element().addClass("dx-numberbox");
            this._setInputInvalidHandler()
        },
        _renderProps: function() {
            this.callBase();
            this._input().prop({
                min: this.option("min"),
                max: this.option("max")
            })
        },
        _setInputInvalidHandler: function() {
            var self = this,
                valueUpdateEvent = this._eventHelper.eventName(this.option("valueUpdateEvent"));
            this._input().on(valueUpdateEvent, function() {
                var validatingInput = self._input()[0];
                if (typeof validatingInput.checkValidity === "function")
                    validatingInput.checkValidity()
            }).focusout($.proxy(this._trimInputValue, this)).on("invalid", $.proxy(this._inputInvalidHandler, this))
        },
        _renderValue: function() {
            var value = this.option("value") ? this.option("value").toString() : this.option("value");
            if (this._input().val() !== value)
                this._input().val(this.option("value"))
        },
        _trimInputValue: function() {
            var $input = this._input(),
                value = $.trim($input.val());
            if (value[value.length - 1] === ".")
                value = value.slice(0, -1);
            this._forceRefreshInputValue(value)
        },
        _inputInvalidHandler: function() {
            var $input = this._input(),
                value = $input.val();
            if (this._oldValue) {
                this.option("value", this._oldValue);
                $input.val(this._oldValue);
                this._oldValue = null;
                return
            }
            if (value && !/,/.test(value))
                return;
            this.option("value", "");
            $input.val("")
        },
        _handleValueChange: function() {
            var $input = this._input(),
                value = $.trim($input.val());
            if (!this._validateValue(value))
                return;
            value = this._parseValue(value);
            if (!value)
                return;
            this.option("value", value);
            if ($input.val() != value)
                $input.val(value)
        },
        _forceRefreshInputValue: function(value) {
            var $input = this._input();
            $input.val("").val(value)
        },
        _validateValue: function(value) {
            var valueUpdateEvent = this._eventHelper.eventName(this.option("valueUpdateEvent")),
                $input = this._input();
            this._oldValue = null;
            this._hasCommaChar = null;
            if (/,/.test(value) || this._calcPointsCount(value) > 1) {
                value = "";
                this._hasCommaChar = true;
                $input.one(valueUpdateEvent, function() {
                    $input.trigger("invalid")
                })
            }
            if (!value) {
                this._oldValue = this.option("value");
                this.option("value", "");
                if (this._hasCommaChar)
                    $input.trigger("invalid");
                return false
            }
            if (value[value.length - 1] === ".")
                return false;
            return true
        },
        _calcPointsCount: function(string) {
            var count = 0,
                position = -1;
            while ((position = $.inArray(".", string, position + 1)) != -1)
                count++;
            return count
        },
        _parseValue: function(value) {
            var number;
            number = Globalize.parseFloat(value, 10, Globalize.findClosestCulture(navigator.language) || Globalize.cultures["default"].language);
            if (isNaN(number)) {
                this._input().val(this.option("value"));
                return undefined
            }
            number = math.max(number, this.option("min"));
            number = math.min(number, this.option("max"));
            return number
        },
        _optionChanged: function(name) {
            if (name === "min" || name === "max")
                this._renderProps(arguments);
            else
                this.callBase.apply(this, arguments)
        }
    }))
})(jQuery, DevExpress);

// Module widgets, file ui.dateBox.js

(function($, DX, undefined) {
    var ui = DX.ui;
    var DATEBOX_CLASS = "dx-datebox",
        formats = ["date", "time", "datetime"];
    var DATE_STANDARD_FORMAT_PATTERNS = {
            date: "yyyy-MM-dd",
            datetime: "yyyy'-'MM'-'dd'T'HH':'mm':'ss'Z'",
            datetimeAndroid: "yyyy'-'MM'-'dd'T'HH':'mm'Z'",
            time: "HH:mm"
        },
        MODE_FORMAT_MAP = {
            date: {
                y: 1,
                M: 1,
                d: 1
            },
            time: {
                h: 1,
                m: 1
            },
            datetime: {
                h: 1,
                m: 1,
                s: 1,
                M: 1,
                y: 1,
                d: 1,
                ms: 1
            }
        };
    var toStandardDateFormat = function(date, mode) {
            return Globalize.format(date, DATE_STANDARD_FORMAT_PATTERNS[mode])
        };
    var fromStandardDateFormat = function(date) {
            return Globalize.parseDate(date, DATE_STANDARD_FORMAT_PATTERNS.datetime) || Globalize.parseDate(date, DATE_STANDARD_FORMAT_PATTERNS.datetimeAndroid) || Globalize.parseDate(date, DATE_STANDARD_FORMAT_PATTERNS.time) || Globalize.parseDate(date, DATE_STANDARD_FORMAT_PATTERNS.date)
        };
    var DATE_OPTION_NAMES = ["y", "M", "d", "h", "m", "s", "ms"],
        DATE_METHOD_NAMES = ["FullYear", "Month", "Date", "Hours", "Minutes", "Seconds", "Milliseconds"];
    var mergeDates = function(target, source, format) {
            if (!source)
                return undefined;
            var options = {};
            $.each(DATE_OPTION_NAMES, function() {
                options[this] = false
            });
            $.extend(options, MODE_FORMAT_MAP[format]);
            if (isNaN(target.getDate()))
                target = new Date;
            $.each(DATE_METHOD_NAMES, function(index) {
                var option = options[DATE_OPTION_NAMES[index]];
                if (option)
                    target["set" + this](source["get" + this]())
            });
            return target
        };
    ui.registerComponent("dxDateBox", ui.dxEditBox.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    format: "date",
                    value: new Date
                })
        },
        _init: function() {
            this.callBase();
            if ($.inArray(this.option("format"), formats) === -1)
                this.option("format", "date");
            this.option("mode", this.option("format"))
        },
        _render: function() {
            this.callBase();
            this._element().addClass(DATEBOX_CLASS)
        },
        _handleValueChange: function() {
            var value = fromStandardDateFormat(this._input().val()),
                modelValue = new Date(this.option("value") && this.option("value").valueOf());
            modelValue = mergeDates(modelValue, value, this.option("format"));
            this.option({value: modelValue})
        },
        _renderValue: function() {
            this._input().val(toStandardDateFormat(this.option("value"), this.option("format")))
        },
        _optionChanged: function(name, value, prevValue) {
            switch (name) {
                case"value":
                    this._renderValue();
                    break;
                case"format":
                    this.option("mode", value);
                    this._renderValue();
                    break;
                default:
                    this.callBase(name, value, prevValue)
            }
        }
    }))
})(jQuery, DevExpress);

// Module widgets, file ui.slider.js

(function($, DX, undefined) {
    var ui = DX.ui,
        translator = DX.translator,
        utils = DX.utils;
    var SLIDER_CLASS = "dx-slider",
        SLIDER_WRAPPER_CLASS = SLIDER_CLASS + "-wrapper",
        SLIDER_HANDLE_CLASS = SLIDER_CLASS + "-handle",
        SLIDER_HANDLE_SELECTOR = "." + SLIDER_HANDLE_CLASS,
        SLIDER_BAR_CLASS = SLIDER_CLASS + "-bar",
        SLIDER_RANGE_CLASS = SLIDER_CLASS + "-range";
    ui.registerComponent("dxSlider", ui.Widget.inherit({
        _activeStateUnit: SLIDER_HANDLE_SELECTOR,
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    min: 0,
                    max: 100,
                    step: 1,
                    value: 50
                })
        },
        _init: function() {
            this.callBase();
            utils.windowResizeCallbacks.add(this._refreshHandler = $.proxy(this._refresh, this))
        },
        _dispose: function() {
            this.callBase();
            utils.windowResizeCallbacks.remove(this._refreshHandler)
        },
        _render: function() {
            this.callBase();
            this._wrapper = $("<div />").addClass(SLIDER_WRAPPER_CLASS);
            this._bar = $("<div />").addClass(SLIDER_BAR_CLASS).appendTo(this._wrapper);
            this._selectedRange = $("<div />").addClass(SLIDER_RANGE_CLASS).appendTo(this._bar);
            this._handle = $("<div />").addClass(SLIDER_HANDLE_CLASS).appendTo(this._bar);
            this._element().addClass(SLIDER_CLASS).append(this._wrapper);
            this._wrapper.dxSwipeable({
                elastic: false,
                startAction: $.proxy(this._handleSwipeStart, this),
                updateAction: $.proxy(this._handleSwipeUpdate, this),
                endAction: $.proxy(this._handleSwipeEnd, this),
                itemWidthFunc: $.proxy(this._itemWidthFunc, this)
            });
            this._renderValue();
            this._renderStartHandler()
        },
        _renderStartHandler: function() {
            var eventName = this._eventHelper.eventName("start"),
                startAction = this._createAction($.proxy(this._handleStart, this));
            this._element().on(eventName, function(e) {
                startAction({jQueryEvent: e})
            })
        },
        _itemWidthFunc: function() {
            return this._element().width()
        },
        _handleSwipeStart: function(e) {
            this._startOffset = this._currentRatio;
            e.maxLeftOffset = this._startOffset;
            e.maxRightOffset = 1 - this._startOffset
        },
        _handleSwipeUpdate: function(e) {
            this._handleValueChange(this._startOffset + e.offset)
        },
        _handleSwipeEnd: function() {
            ui.gestureUtils.forget()
        },
        _handleValueChange: function(ratio) {
            var min = this.option("min"),
                max = this.option("max"),
                step = this.option("step"),
                newChange = ratio * (max - min),
                newValue = min + newChange;
            if (!step || isNaN(step))
                step = 1;
            step = parseFloat(step.toFixed(5));
            if (step === 0)
                step = 0.00001;
            if (step < 0)
                return;
            if (newValue === max || newValue === min)
                this.option("value", newValue);
            else {
                var stepChunks = (step + "").split('.'),
                    exponent = stepChunks.length > 1 ? stepChunks[1].length : exponent;
                this.option("value", Number((Math.round(newChange / step) * step + min).toFixed(exponent)))
            }
        },
        _handleStart: function(args) {
            var e = args.jQueryEvent,
                instance = args.component;
            if (instance._eventHelper.needSkipEvent(e))
                return;
            this._currentRatio = (this._eventHelper.eventX(e) - this._bar.offset().left) / this._bar.width();
            this._handleValueChange(this._currentRatio)
        },
        _renderValue: function() {
            var val = this.option("value"),
                min = this.option("min"),
                max = this.option("max");
            if (min > max)
                return;
            if (val < min) {
                this.option("value", min);
                this._currentRatio = 0;
                return
            }
            if (val > max) {
                this.option("value", max);
                this._currentRatio = 1;
                return
            }
            var handleWidth = this._handle.outerWidth(),
                barWidth = this._bar.width(),
                ratio = min === max ? 0 : (val - min) / (max - min);
            this._selectedRange.width(ratio * barWidth);
            translator.move(this._handle, {left: ratio * barWidth - handleWidth / 2});
            this._currentRatio = ratio
        },
        _refresh: function() {
            this._renderValue()
        },
        _feedbackOff: function(isGestureStart) {
            if (isGestureStart)
                return;
            this.callBase.apply(this, arguments)
        }
    }))
})(jQuery, DevExpress);

// Module widgets, file ui.rangeSlider.js

(function($, DX, undefined) {
    var ui = DX.ui,
        translator = DX.translator;
    var SLIDER_HANDLE_CLASS = "dx-slider-handle";
    ui.registerComponent("dxRangeSlider", ui.dxSlider.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    start: 40,
                    end: 60,
                    value: 50
                })
        },
        _render: function() {
            this._handleRight = $("<div />").addClass(SLIDER_HANDLE_CLASS);
            this.callBase();
            this._handleRight.appendTo(this._bar)
        },
        _handleStart: function(args) {
            var e = args.jQueryEvent;
            var eventOffsetX = this._eventHelper.eventX(e) - this._bar.offset().left,
                leftHandleX = this._handle.position().left,
                rightHandleX = this._handleRight.position().left;
            this._handlersDistance = Math.abs(leftHandleX - rightHandleX);
            this._capturedHandle = (leftHandleX + rightHandleX) / 2 > eventOffsetX ? this._handle : this._handleRight;
            this.callBase(args)
        },
        _handleSwipeUpdate: function(e) {
            if (Math.abs(this.option("start") - this.option("end")) === 0 && this._handlersDistance < this._handle.outerWidth()) {
                this._feedbackOff(false, true);
                this._capturedHandle = e.offset <= 0 ? this._handle : this._handleRight;
                this._feedbackOn(this._capturedHandle, true)
            }
            this.callBase(e)
        },
        _handleValueChange: function(ratio) {
            this.callBase(ratio);
            var option = this._capturedHandle === this._handle ? "start" : "end",
                start = this.option("start"),
                end = this.option("end"),
                newValue = this.option("value");
            if (newValue > end && option === "start")
                newValue = end;
            if (newValue < start && option === "end")
                newValue = start;
            this.option(option, newValue)
        },
        _renderValue: function() {
            var valStart = this.option("start"),
                valEnd = this.option("end"),
                min = this.option("min"),
                max = this.option("max");
            if (valStart < min)
                valStart = min;
            if (valEnd > max)
                valEnd = max;
            if (valEnd < valStart)
                valEnd = valStart;
            var handleWidth = this._handle.outerWidth(),
                barWidth = this._bar.width(),
                ratio1 = max === min ? 0 : (valStart - min) / (max - min),
                ratio2 = max === min ? 0 : (valEnd - min) / (max - min);
            this._selectedRange.width((ratio2 - ratio1) * barWidth);
            translator.move(this._selectedRange, {left: ratio1 * barWidth});
            translator.move(this._handle, {left: ratio1 * barWidth - handleWidth / 2});
            translator.move(this._handleRight, {left: ratio2 * barWidth - handleWidth / 2})
        }
    }))
})(jQuery, DevExpress);

// Module widgets, file ui.tabs.js

(function($, DX, undefined) {
    var ui = DX.ui,
        TABS_CLASS = "dx-tabs",
        TABS_WRAPPER_CLASS = "dx-indent-wrapper",
        TABS_ITEM_CLASS = "dx-tab",
        TABS_ITEM_SELECTOR = ".dx-tab",
        TABS_ITEM_SELECTED_CLASS = "dx-tab-selected",
        TABS_ITEM_TEXT_CLASS = "dx-tab-text",
        ICON_CLASS = "dx-icon",
        TABS_ITEM_DATA_KEY = "dxTabData";
    ui.registerComponent("dxTabs", ui.CollectionContainerWidget.inherit({
        _activeStateUnit: TABS_ITEM_SELECTOR,
        _defaultOptions: function() {
            return $.extend(this.callBase(), {selectedIndex: -1})
        },
        _itemClass: function() {
            return TABS_ITEM_CLASS
        },
        _itemDataKey: function() {
            return TABS_ITEM_DATA_KEY
        },
        _itemRenderDefault: function(item, index, itemElement) {
            this.callBase(item, index, itemElement);
            if (item.html)
                return;
            var text = item.text,
                icon = item.icon,
                iconSrc = item.iconSrc,
                iconElement;
            if (text)
                itemElement.wrapInner($("<span />").addClass(TABS_ITEM_TEXT_CLASS));
            if (icon)
                iconElement = $("<span />").addClass(ICON_CLASS + "-" + icon);
            else if (iconSrc)
                iconElement = $("<img />").attr("src", iconSrc);
            if (iconElement)
                iconElement.addClass(ICON_CLASS).prependTo(itemElement)
        },
        _render: function() {
            this.callBase();
            this._element().addClass(TABS_CLASS);
            this._renderWrapper();
            this._renderSelectedIndex()
        },
        _renderWrapper: function() {
            this._element().wrapInner($("<div />").addClass(TABS_WRAPPER_CLASS))
        },
        _renderSelectedIndex: function() {
            var selectedIndex = this.option("selectedIndex");
            this._tabs().each(function(tabIndex) {
                $(this).toggleClass(TABS_ITEM_SELECTED_CLASS, tabIndex === selectedIndex)
            })
        },
        _renderEmptyMessage: $.noop,
        _tabs: function() {
            return this._items()
        },
        _attachClickEvent: function() {
            var itemSelector = this._itemSelector(),
                itemClickAction = this._createAction(this._handleItemClick);
            this._element().off("." + this.NAME, itemSelector).on(this._eventHelper.eventName("end"), itemSelector, function(e) {
                itemClickAction({jQueryEvent: e})
            })
        },
        _handleItemClick: function(args) {
            var e = args.jQueryEvent,
                instance = args.component;
            if (instance._eventHelper.needSkipEvent(e))
                return;
            var clickedItemElement = $(e.target).closest(instance._itemSelector()).get(0);
            instance.option("selectedIndex", instance._tabs().index(clickedItemElement));
            e.target = instance._tabs().get(instance.option("selectedIndex"));
            instance._handleItemEvent(e, "itemClickAction")
        },
        _optionChanged: function(name) {
            switch (name) {
                case"selectedIndex":
                    this._renderSelectedIndex();
                    break;
                default:
                    this.callBase.apply(this, arguments)
            }
        }
    }))
})(jQuery, DevExpress);

// Module widgets, file ui.navBar.js

(function($, DX, undefined) {
    var ui = DX.ui,
        NAVBAR_CLASS = "dx-navbar",
        NABAR_ITEM_CLASS = "dx-nav-item",
        NAVBAR_ITEM_CONTENT_CLASS = "dx-nav-item-content";
    ui.registerComponent('dxNavBar', ui.dxTabs.inherit({
        _render: function() {
            this.callBase();
            this._element().addClass(NAVBAR_CLASS)
        },
        _renderItem: function(index, item) {
            var itemElement = this.callBase(index, item);
            return itemElement.addClass(NABAR_ITEM_CLASS).wrapInner($("<div />").addClass(NAVBAR_ITEM_CONTENT_CLASS))
        }
    }))
})(jQuery, DevExpress);

// Module widgets, file ui.toolbar.js

(function($, DX, undefined) {
    var ui = DX.ui;
    var TOOLBAR_CLASS = "dx-toolbar",
        TOOLBAR_ITEM_CLASS = "dx-toolbar-item",
        TOOLBAR_LABEL_CLASS = "dx-toolbar-label",
        TOOLBAR_BUTTON_CLASS = "dx-toolbar-button",
        TOOLBAR_ITEM_DATA_KEY = "dxToolbarItemDataKey";
    ui.registerComponent("dxToolbar", ui.CollectionContainerWidget.inherit({
        _itemContainer: function() {
            return this._element().find([".dx-toolbar-left", ".dx-toolbar-center", ".dx-toolbar-right"].join(","))
        },
        _itemClass: function() {
            return TOOLBAR_ITEM_CLASS
        },
        _itemDataKey: function() {
            return TOOLBAR_ITEM_DATA_KEY
        },
        _itemRenderDefault: function(item, index, itemElement) {
            this.callBase(item, index, itemElement);
            var widget = item.widget;
            if (widget) {
                var widgetElement = $("<div />").appendTo(itemElement),
                    widgetName = DX.inflector.camelize("dx-" + widget),
                    options = item.options || {};
                widgetElement[widgetName](options)
            }
        },
        _render: function() {
            this._element().addClass(TOOLBAR_CLASS);
            this._renderContainers();
            this.callBase()
        },
        _renderEmptyMessage: $.noop,
        _clean: function() {
            this._element().children().empty()
        },
        _renderItem: function(index, item) {
            var align = item.align || "center",
                container = this._element().find(".dx-toolbar-" + align);
            var itemElement = this.callBase(index, item, container);
            itemElement.addClass(TOOLBAR_BUTTON_CLASS);
            if (item.text)
                itemElement.addClass(TOOLBAR_LABEL_CLASS).removeClass(TOOLBAR_BUTTON_CLASS);
            return itemElement
        },
        _renderContainers: function() {
            var element = this._element();
            $.each(["left", "center", "right"], function() {
                var containerClass = "dx-toolbar-" + this,
                    container = element.find("." + containerClass);
                if (!container.length)
                    container = $('<div />').addClass(containerClass).appendTo(element)
            })
        }
    }))
})(jQuery, DevExpress);

// Module widgets, file ui.list.js

(function($, DX, undefined) {
    var ui = DX.ui;
    var LIST_CLASS = "dx-list",
        LIST_ITEM_CLASS = "dx-list-item",
        LIST_ITEM_SELECTOR = "." + LIST_ITEM_CLASS,
        LIST_GROUD_CLASS = "dx-list-group",
        LIST_GROUP_HEADER_CLASS = "dx-list-group-header",
        LIST_HAS_NEXT_CLASS = "dx-has-next",
        LIST_NEXT_BUTTON_CLASS = "dx-list-next-button",
        LIST_ITEM_DATA_KEY = "dxListItemData",
        LIST_FEEDBACK_SHOW_TIMEOUT = 70,
        ITEM_SWIPE_SCROLL_SUPRESSION_THRESHOLD = 30,
        ITEM_SWIPE_DURATION_THRESHOLD = 1000,
        ITEM_SWIPE_HORIZONTAL_DISTANCE_THRESHOLD = 30,
        ITEM_SWIPE_VERTICAL_DISTANCE_THRESHOLD = 75;
    ui.registerComponent("dxList", ui.CollectionContainerWidget.inherit({
        _activeStateUnit: LIST_ITEM_SELECTOR,
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    pullRefreshEnabled: false,
                    autoPagingEnabled: true,
                    scrollingEnabled: true,
                    scrollByContent: true,
                    scrollByThumb: false,
                    showScrollbar: true,
                    showNextButton: false,
                    itemHoldAction: null,
                    itemHoldTimeout: 750,
                    itemSwipeAction: null,
                    grouped: false,
                    groupTemplate: "group",
                    groupRender: null
                })
        },
        _itemClass: function() {
            return LIST_ITEM_CLASS
        },
        _itemDataKey: function() {
            return LIST_ITEM_DATA_KEY
        },
        _itemContainer: function() {
            return this._container
        },
        _init: function() {
            this._dataLoading = true;
            this.callBase();
            this._container = this._element();
            this._initScrollView();
            this._feedbackShowTimeout = LIST_FEEDBACK_SHOW_TIMEOUT
        },
        _initScrollView: function() {
            this._scrollView = this._element().dxScrollView({
                disabled: this.option("disabled") || !this.option("scrollingEnabled"),
                pullDownAction: this.option("scrollingEnabled") && this.option("pullRefreshEnabled") ? $.proxy(this._handlePullDown, this) : null,
                reachBottomAction: this.option("scrollingEnabled") && this.option("autoPagingEnabled") && this._dataSource ? $.proxy(this._handleScrollBottom, this) : null
            }).data("dxScrollView");
            this._scrollView.toggleLoading(!!this._dataSource);
            this._container = this._scrollView.content()
        },
        _afterItemsRendered: function(tryLoadMore) {
            var allDataLoaded = !tryLoadMore || this._allDataLoaded();
            this._scrollView.option("updateAction", allDataLoaded ? null : $.proxy(this._handleScrollViewUpdated, this));
            this._scrollView.toggleLoading(this._dataLoading);
            this._scrollView.release(allDataLoaded);
            if (this._nextButton)
                this._toggleNextButton(!allDataLoaded)
        },
        _handlePullDown: function() {
            if (this._dataSource)
                this._dataSource.reload();
            else
                this._afterItemsRendered()
        },
        _handleScrollBottom: function() {
            if (this._dataSource)
                this._dataSource.nextPage(true);
            else
                this._afterItemsRendered()
        },
        _handleScrollViewUpdated: function(scrollViewAction) {
            var scrollView = scrollViewAction.component;
            if (!scrollView.isFull())
                this._handleScrollBottom()
        },
        _handleDataSourceLoadError: function(error) {
            if (this._initialized)
                this._afterItemsRendered()
        },
        _render: function() {
            if (!this._dataSource)
                this._dataLoading = false;
            var actionItemStart = new DX.Action(this._handleItemStart, {context: this}),
                actionItemEnd = new DX.Action(this._handleItemEnd, {context: this});
            this._element().addClass(LIST_CLASS);
            this.callBase();
            this._element().on(this._eventHelper.eventName("start"), this._itemSelector(), $.proxy(actionItemStart.execute, actionItemStart)).on(this._eventHelper.eventName("end"), this._itemSelector(), $.proxy(actionItemEnd.execute, actionItemEnd));
            if (this.option("showNextButton") && this._dataSource)
                this._getNextButton()
        },
        _allDataLoaded: function() {
            return !this._dataSource || this._dataSource.isLastPage()
        },
        _getNextButton: function() {
            if (!this._nextButton)
                this._nextButton = this._createNextButton();
            return this._nextButton
        },
        _createNextButton: function() {
            var showButton = !this._allDataLoaded();
            this._element().toggleClass(LIST_HAS_NEXT_CLASS, showButton);
            return $("<div/>").addClass(LIST_NEXT_BUTTON_CLASS).toggle(showButton).append($("<div/>").dxButton({
                    text: "More",
                    clickAction: $.proxy(this._handleNextButton, this)
                })).appendTo(this._element())
        },
        _renderItems: function() {
            if (this.option("grouped"))
                $.each(this.option("items") || [], $.proxy(this._renderGroup, this));
            else
                this.callBase();
            this._afterItemsRendered(true)
        },
        _handleNextButton: function() {
            if (this._dataLoading)
                return;
            this._dataLoading = true;
            this._scrollView.toggleLoading(true);
            this._dataSource.nextPage(true)
        },
        _toggleNextButton: function(showButton) {
            var nextButton = this._getNextButton();
            nextButton.toggle(showButton);
            this._element().toggleClass(LIST_HAS_NEXT_CLASS, showButton)
        },
        _handleItemStart: function(e) {
            if (this._eventHelper.needSkipEvent(e))
                return;
            clearTimeout(this._holdTimer);
            this._holdTimer = setTimeout($.proxy(this._handleItemHold, this, e), this.option("itemHoldTimeout"));
            this._handleSwipe(e)
        },
        _handleItemEnd: function() {
            clearTimeout(this._holdTimer)
        },
        _handleItemHold: function(e) {
            this._handleItemEvent(e, "itemHoldAction")
        },
        _handleSwipe: function(e) {
            var self = this,
                eventHelper = this._eventHelper,
                start = eventHelper.eventData(e),
                end;
            var moveHandler = function(e) {
                    if (!start)
                        return;
                    end = eventHelper.eventData(e);
                    if (Math.abs(start.x - end.x) > ITEM_SWIPE_SCROLL_SUPRESSION_THRESHOLD)
                        e.preventDefault()
                };
            var endHandler = function(e) {
                    self._element().off(eventHelper.eventName("move"));
                    if (start && end) {
                        var delta = eventHelper.eventDelta(end, start);
                        if (delta.time < ITEM_SWIPE_DURATION_THRESHOLD && Math.abs(delta.x) > ITEM_SWIPE_HORIZONTAL_DISTANCE_THRESHOLD && Math.abs(delta.y) < ITEM_SWIPE_VERTICAL_DISTANCE_THRESHOLD)
                            self._handleItemEvent(e, "itemSwipeAction", {direction: delta.x > 0 ? "left" : "right"})
                    }
                    start = end = undefined
                };
            this._element().on(eventHelper.eventName("move"), this._itemSelector(), moveHandler).one(eventHelper.eventName("end"), this._itemSelector(), endHandler)
        },
        _groupRenderDefault: function(group) {
            return String(group.key || group)
        },
        _renderGroup: function(index, group) {
            var self = this;
            var groupElement = $("<div />").addClass(LIST_GROUD_CLASS).appendTo(self._itemContainer());
            var groupRenderer = self.option("groupRender"),
                groupTemplateName = self.option("groupTemplate"),
                groupTemplate = self._getTemplate(group.template || groupTemplateName, index, group),
                groupHeaderElement;
            var renderArgs = {
                    index: index,
                    group: group,
                    container: groupElement
                };
            if (groupRenderer)
                groupHeaderElement = self._createGroupByRenderer(groupRenderer, renderArgs);
            else if (groupTemplate)
                groupHeaderElement = self._createGroupByTemplate(groupTemplate, renderArgs);
            else
                groupHeaderElement = self._createGroupByRenderer(self._groupRenderDefault, renderArgs);
            groupHeaderElement.addClass(LIST_GROUP_HEADER_CLASS);
            $.each(group.items || [], function(index, item) {
                self._renderItem(index, item, groupElement)
            })
        },
        _createGroupByRenderer: function(groupRenderer, renderArgs) {
            var groupElement = $("<div />").appendTo(renderArgs.container);
            var rendererResult = groupRenderer(renderArgs.group, renderArgs.index, groupElement);
            if (rendererResult && groupElement[0] !== rendererResult[0])
                groupElement.append(rendererResult);
            return groupElement
        },
        _createGroupByTemplate: function(groupTemplate, renderArgs) {
            return groupTemplate.render(renderArgs.container, renderArgs.group)
        },
        _handleDataSourceChanged: function(items) {
            this._dataLoading = false;
            this.callBase(items)
        },
        _dispose: function() {
            clearTimeout(this._holdTimer);
            this.callBase()
        },
        _optionChanged: function(name, value, prevValue) {
            switch (name) {
                case"dataSource":
                    this.callBase(name, value, prevValue);
                    this._initScrollView();
                    return;
                case"pullRefreshEnabled":
                case"autoPagingEnabled":
                case"scrollingEnabled":
                case"scrollByContent":
                case"scrollByThumb":
                    this._initScrollView();
                    return;
                default:
                    this.callBase(name, value, prevValue)
            }
        },
        update: function(doAnimate) {
            var self = this,
                deferred = $.Deferred();
            if (self._scrollView)
                self._scrollView.update(doAnimate).done(function() {
                    deferred.resolveWith(self)
                });
            else
                deferred.resolveWith(self);
            return deferred.promise()
        }
    }))
})(jQuery, DevExpress);

// Module widgets, file ui.tileView.js

(function($, DX, undefined) {
    var ui = DX.ui,
        utils = DX.utils;
    var TILEVIEW_CLASS = "dx-tileview",
        TILEVIEW_WRAPPER_CLASS = "dx-tiles-wrapper",
        TILEVIEW_ITEM_CLASS = "dx-tile",
        TILEVIEW_ITEM_SELECTOR = "." + TILEVIEW_ITEM_CLASS,
        TILEVIEW_ITEM_DATA_KEY = "dxTileData";
    ui.registerComponent("dxTileView", ui.CollectionContainerWidget.inherit({
        _activeStateUnit: TILEVIEW_ITEM_SELECTOR,
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    items: null,
                    bounceEnabled: true,
                    showScrollbar: false,
                    listHeight: 500,
                    baseItemWidth: 100,
                    baseItemHeight: 100,
                    itemMargin: 20
                })
        },
        _itemClass: function() {
            return TILEVIEW_ITEM_CLASS
        },
        _itemDataKey: function() {
            return TILEVIEW_ITEM_DATA_KEY
        },
        _itemContainer: function() {
            return this._wrapper
        },
        _init: function() {
            var self = this;
            self.callBase();
            self._refreshHandler = function() {
                self._renderGeometry()
            };
            utils.windowResizeCallbacks.add(self._refreshHandler)
        },
        _dispose: function() {
            this.callBase();
            utils.windowResizeCallbacks.remove(this._refreshHandler)
        },
        _render: function() {
            this.cellsPerColumn = 1;
            this._element().addClass(TILEVIEW_CLASS).height(this.option("listHeight"));
            if (!this._wrapper)
                this._renderWrapper();
            this._initScrollable();
            this.callBase();
            this._renderGeometry()
        },
        _renderWrapper: function() {
            this._wrapper = $("<div />").addClass(TILEVIEW_WRAPPER_CLASS).appendTo(this._element())
        },
        _initScrollable: function() {
            this._element().dxScrollable({
                direction: "horizontal",
                showScrollbar: this.option("showScrollbar"),
                bounceEnabled: this.option("bounceEnabled")
            })
        },
        _renderGeometry: function() {
            var items = this.option("items") || [],
                maxItemHeight = Math.max.apply(Math, $.map(items || [], function(item) {
                    return item.heightRatio || 1
                }));
            this.cellsPerColumn = Math.floor(this._element().height() / (this.option("baseItemHeight") + this.option("itemMargin")));
            this.cellsPerColumn = Math.max(this.cellsPerColumn, maxItemHeight);
            this.cells = [];
            this.cells.push(new Array(this.cellsPerColumn));
            this._arrangeItems(items);
            this._wrapper.width(this.cells.length * this.option("baseItemWidth") + (this.cells.length + 1) * this.option("itemMargin"))
        },
        _arrangeItems: function(items) {
            var self = this;
            $.each(items, function(index, item) {
                item.widthRatio = item.widthRatio || 1;
                item.heightRatio = item.heightRatio || 1;
                item.text = item.text || "";
                var $item = self._items().eq(index),
                    itemPosition = self._getItemPosition(item);
                if (itemPosition.x === -1)
                    itemPosition.x = self.cells.push(new Array(this.cellsPerColumn)) - 1;
                self._occupyCells(item, itemPosition);
                self._arrangeItem($item, item, itemPosition)
            })
        },
        _getItemPosition: function(item) {
            var position = {
                    x: -1,
                    y: 0
                };
            for (var col = 0; col < this.cells.length; col++) {
                for (var row = 0; row < this.cellsPerColumn; row++)
                    if (this._itemFit(col, row, item)) {
                        position.x = col;
                        position.y = row;
                        break
                    }
                if (position.x > -1)
                    break
            }
            return position
        },
        _itemFit: function(column, row, item) {
            var result = true;
            if (row + item.heightRatio > this.cellsPerColumn)
                return false;
            for (var columnIndex = column; columnIndex < column + item.widthRatio; columnIndex++)
                for (var rowIndex = row; rowIndex < row + item.heightRatio; rowIndex++)
                    if (this.cells.length - 1 < columnIndex)
                        this.cells.push(new Array(this.cellsPerColumn));
                    else if (this.cells[columnIndex][rowIndex]) {
                        result = false;
                        break
                    }
            return result
        },
        _occupyCells: function(item, itemPosition) {
            for (var i = itemPosition.x; i < itemPosition.x + item.widthRatio; i++)
                for (var j = itemPosition.y; j < itemPosition.y + item.heightRatio; j++)
                    this.cells[i][j] = true
        },
        _arrangeItem: function($item, item, itemPosition) {
            var baseItemHeight = this.option("baseItemHeight"),
                baseItemWidth = this.option("baseItemWidth"),
                itemMargin = this.option("itemMargin");
            $item.css({
                height: item.heightRatio * baseItemHeight + (item.heightRatio - 1) * itemMargin,
                width: item.widthRatio * baseItemWidth + (item.widthRatio - 1) * itemMargin,
                top: itemPosition.y * baseItemHeight + (itemPosition.y + 1) * itemMargin,
                left: itemPosition.x * baseItemWidth + (itemPosition.x + 1) * itemMargin
            })
        },
        _optionChanged: function(name) {
            if (name === "bounceEnabled" || name === "showScrollbar")
                this._initScrollable();
            else
                this.callBase.apply(this, arguments)
        }
    }))
})(jQuery, DevExpress);

// Module widgets, file ui.gallery.js

(function($, DX, undefined) {
    var ui = DX.ui,
        fx = DX.fx,
        translator = DX.translator,
        GALLERY_CLASS = "dx-gallery",
        GALLERY_ITEM_CONTAINER_CLASS = GALLERY_CLASS + "-wrapper",
        GALLERY_ITEM_CLASS = GALLERY_CLASS + "-item",
        GALLERY_ITEM_SELECTOR = "." + GALLERY_ITEM_CLASS,
        GALLERY_ITEM_SELECTED_CLASS = GALLERY_ITEM_CLASS + "-selected",
        GALLERY_INDICATOR_CLASS = GALLERY_CLASS + "-indicator",
        GALLERY_INDICATOR_SELECTOR = "." + GALLERY_INDICATOR_CLASS,
        GALLERY_INDICATOR_ITEM_CLASS = GALLERY_INDICATOR_CLASS + "-item",
        GALLERY_INDICATOR_ITEM_SELECTOR = "." + GALLERY_INDICATOR_ITEM_CLASS,
        GALLERY_INDICATOR_ITEM_SELECTED_CLASS = GALLERY_INDICATOR_ITEM_CLASS + "-selected",
        GALLERY_ITEM_DATA_KEY = "dxGalleryItemData";
    ui.registerComponent("dxGalleryNavButton", ui.Widget.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {direction: "next"})
        },
        _render: function() {
            this.callBase();
            this._element().addClass(GALLERY_CLASS + "-nav-button-" + this.option("direction"))
        }
    }));
    ui.registerComponent("dxGallery", ui.CollectionContainerWidget.inherit({
        _activeStateUnit: GALLERY_ITEM_SELECTOR,
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    animationDuration: 400,
                    loop: false,
                    swipeEnabled: true,
                    indicatorEnabled: true,
                    showIndicator: true,
                    selectedIndex: 0,
                    slideshowDelay: 0,
                    showNavButtons: false
                })
        },
        _dataSourceOptions: function() {
            return {paginate: false}
        },
        _itemContainer: function() {
            return this._container
        },
        _itemClass: function() {
            return GALLERY_ITEM_CLASS
        },
        _itemDataKey: function() {
            return GALLERY_ITEM_DATA_KEY
        },
        _itemWidth: function() {
            return this._items().first().outerWidth()
        },
        _itemsCount: function() {
            return (this.option("items") || []).length
        },
        _itemRenderDefault: function(item, index, itemElement) {
            this.callBase(item, index, itemElement);
            if (!$.isPlainObject(item))
                itemElement.append($("<img />").attr("src", String(item)))
        },
        _render: function() {
            this._element().addClass(GALLERY_CLASS).on(this._eventHelper.eventName("dragstart"), "img", function() {
                return false
            });
            this._renderItemContainer();
            this.callBase();
            this._renderItemPositions();
            this._renderIndicator();
            this._renderSelectedIndicatorItem();
            this._renderUserInteraction();
            this._renderNavButtons();
            this._setupSlideShow()
        },
        _renderItemContainer: function() {
            if (this._container)
                return;
            this._container = $("<div />").addClass(GALLERY_ITEM_CONTAINER_CLASS).appendTo(this._element())
        },
        _renderItemPositions: function(offset, animate) {
            offset = offset || 0;
            var self = this,
                itemWidth = this._itemWidth(),
                selectedIndex = this.option("selectedIndex"),
                animationDuration = this.option("animationDuration"),
                targetIndex = offset - selectedIndex,
                d = $.Deferred(),
                animationPromises = [];
            this._items().each(function(index) {
                index = self._flipIndex(targetIndex + index);
                var lastIndex = $(this).data("dxGalleryUIIndex"),
                    itemPosition = {left: index * itemWidth},
                    animConfig = {
                        type: "slide",
                        to: itemPosition,
                        duration: animationDuration
                    };
                if (index - lastIndex > 1)
                    animConfig.from = {left: (index + 1) * itemWidth};
                if (lastIndex - index > 1)
                    animConfig.from = {left: (index - 1) * itemWidth};
                $(this).data("dxGalleryUIIndex", index);
                if (animate)
                    animationPromises.push(fx.animate(this, animConfig));
                else
                    translator.move($(this), itemPosition)
            });
            $.when.apply($, animationPromises).done(function() {
                d.resolveWith(self)
            });
            return d.promise()
        },
        _renderIndicator: function() {
            if (!this.option("showIndicator")) {
                this._cleanIndicators();
                return
            }
            var indicator = this._indicator = $("<div />").addClass(GALLERY_INDICATOR_CLASS).appendTo(this._element());
            $.each(this.option("items") || [], function() {
                $("<div />").addClass(GALLERY_INDICATOR_ITEM_CLASS).appendTo(indicator)
            })
        },
        _cleanIndicators: function() {
            if (this._indicator)
                this._indicator.remove()
        },
        _renderSelectedIndicatorItem: function() {
            var selectedIndex = this.option("selectedIndex");
            this._items().removeClass(GALLERY_ITEM_SELECTED_CLASS).eq(selectedIndex).addClass(GALLERY_ITEM_SELECTED_CLASS);
            this._element().find(GALLERY_INDICATOR_ITEM_SELECTOR).removeClass(GALLERY_INDICATOR_ITEM_SELECTED_CLASS).eq(selectedIndex).addClass(GALLERY_INDICATOR_ITEM_SELECTED_CLASS)
        },
        _renderUserInteraction: function() {
            var self = this,
                rootElement = self._element(),
                swipeEnabled = self.option("swipeEnabled"),
                indicatorEnabled = self.option("indicatorEnabled"),
                cursor = swipeEnabled ? "pointer" : "default";
            rootElement.dxSwipeable({
                startAction: swipeEnabled ? $.proxy(self._handleSwipeStart, self) : function(e) {
                    e.cancel = true
                },
                updateAction: $.proxy(self._handleSwipeUpdate, self),
                endAction: $.proxy(self._handleSwipeEnd, self),
                itemWidthFunc: $.proxy(self._itemWidth, self)
            });
            rootElement.find(GALLERY_INDICATOR_ITEM_SELECTOR).css({cursor: cursor}).off(this._eventHelper.eventName("click")).on(this._eventHelper.eventName("click"), function() {
                if (!indicatorEnabled)
                    return;
                var index = $(this).index();
                self._renderItemPositions(self.option("selectedIndex") - index, true).done(function() {
                    this._suppressRenderItemPositions = true;
                    self.option("selectedIndex", index)
                })
            })
        },
        _renderNavButtons: function() {
            var self = this;
            if (!self.option("showNavButtons")) {
                self._cleanNavButtons();
                return
            }
            self._prevNavButton = $("<div />").dxGalleryNavButton({
                direction: "prev",
                clickAction: function() {
                    self.prevItem(true)
                }
            }).appendTo(this._element());
            self._nextNavButton = $("<div />").dxGalleryNavButton({
                direction: "next",
                clickAction: function() {
                    self.nextItem(true)
                }
            }).appendTo(this._element());
            this._renderNavButtonsVisibility()
        },
        _cleanNavButtons: function() {
            if (this._prevNavButton)
                this._prevNavButton.remove();
            if (this._prevNavButton)
                this._nextNavButton.remove()
        },
        _renderNavButtonsVisibility: function() {
            if (!this.option("showNavButtons"))
                return;
            var selectedIndex = this.option("selectedIndex"),
                loop = this.option("loop"),
                itemsCount = this._itemsCount();
            if (selectedIndex < itemsCount && selectedIndex > 0 || loop) {
                this._prevNavButton.show();
                this._nextNavButton.show()
            }
            if (!loop) {
                if (selectedIndex < 1)
                    this._prevNavButton.hide();
                if (selectedIndex === itemsCount - 1)
                    this._nextNavButton.hide()
            }
        },
        _setupSlideShow: function() {
            var self = this,
                slideshowDelay = self.option("slideshowDelay");
            if (!slideshowDelay)
                return;
            clearTimeout(self._slideshowTimer);
            self._slideshowTimer = setTimeout(function() {
                if (self._userInteraction) {
                    self._setupSlideShow();
                    return
                }
                self.nextItem(true).done(self._setupSlideShow)
            }, slideshowDelay)
        },
        _handleSwipeStart: function(e) {
            var itemsCount = this._itemsCount();
            if (!itemsCount || fx.animating(this._items().eq(0))) {
                e.cancel = true;
                return
            }
            this._userInteraction = true;
            if (!this.option("loop")) {
                var selectedIndex = this.option("selectedIndex");
                e.maxLeftOffset = itemsCount - selectedIndex - 1;
                e.maxRightOffset = selectedIndex
            }
        },
        _handleSwipeUpdate: function(e) {
            this._renderItemPositions(e.offset)
        },
        _handleSwipeEnd: function(e) {
            this._renderItemPositions(e.targetOffset, true).done(function() {
                var selectedIndex = this.option("selectedIndex"),
                    newIndex = this._fitIndex(selectedIndex - e.targetOffset);
                this._suppressRenderItemPositions = true;
                this.option("selectedIndex", newIndex);
                this._userInteraction = false;
                this._setupSlideShow()
            })
        },
        _flipIndex: function(index) {
            if (!this.option("loop"))
                return index;
            var itemsCount = this._itemsCount();
            index = index % itemsCount;
            if (index > (itemsCount + 1) / 2)
                index -= itemsCount;
            if (index < -(itemsCount - 1) / 2)
                index += itemsCount;
            return index
        },
        _fitIndex: function(index) {
            if (!this.option("loop"))
                return index;
            var itemsCount = this._itemsCount();
            index = index % itemsCount;
            if (index < 0)
                index += itemsCount;
            return index
        },
        _clean: function() {
            this.callBase();
            this._cleanIndicators();
            this._cleanNavButtons()
        },
        _dispose: function() {
            clearTimeout(this._slideshowTimer);
            this.callBase()
        },
        _handleSelectedIndexChanged: function() {
            if (!this._suppressRenderItemPositions)
                this._renderItemPositions();
            this._suppressRenderItemPositions = false;
            this._renderSelectedIndicatorItem();
            this._renderNavButtonsVisibility()
        },
        _optionChanged: function(name, value, prevValue) {
            switch (name) {
                case"animationDuration":
                case"loop":
                    this._renderNavButtonsVisibility();
                    return;
                case"selectedIndex":
                    this._handleSelectedIndexChanged();
                    return;
                case"showIndicator":
                    this._renderIndicator();
                    return;
                case"showNavButtons":
                    this._renderNavButtons();
                    return;
                case"slideshowDelay":
                    this._setupSlideShow();
                    return;
                case"swipeEnabled":
                case"indicatorEnabled":
                    this._renderUserInteraction();
                    return;
                default:
                    this.callBase(name, value, prevValue)
            }
        },
        goToItem: function(itemIndex, animation) {
            var d = new $.Deferred,
                selectedIndex = this.option("selectedIndex"),
                itemsCount = this._itemsCount();
            itemIndex = this._fitIndex(itemIndex);
            if (itemIndex > itemsCount - 1 || itemIndex < 0)
                return d.resolveWith(this).promise();
            this._renderItemPositions(selectedIndex - itemIndex, animation).done(function() {
                this._suppressRenderItemPositions = true;
                this.option("selectedIndex", itemIndex);
                d.resolveWith(this)
            });
            return d.promise()
        },
        prevItem: function(animation) {
            return this.goToItem(this.option("selectedIndex") - 1, animation)
        },
        nextItem: function(animation) {
            return this.goToItem(this.option("selectedIndex") + 1, animation)
        }
    }))
})(jQuery, DevExpress);

// Module widgets, file ui.overlay.js

(function($, DX, undefined) {
    var ui = DX.ui,
        utils = DX.utils;
    var OVERLAY_CLASS = "dx-overlay",
        OVERLAY_CONTENT_CLASS = OVERLAY_CLASS + "-content",
        OVERLAY_SHADER_CLASS = OVERLAY_CLASS + "-shader",
        OVERLAY_MODAL_CLASS = OVERLAY_CLASS + "-modal",
        OVERLAY_SHOW_EVENT_TOLERANCE = 50,
        ACTIONS = ["showingAction", "shownAction", "hiddingAction", "hiddenAction"];
    var defaultTargetContainer = ".dx-viewport";
    ui.registerComponent("dxOverlay", ui.ContainerWidget.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    activeStateEnabled: false,
                    visible: false,
                    shading: true,
                    closeOnOutsideClick: false,
                    position: {
                        my: "center",
                        at: "center",
                        of: window
                    },
                    animation: {
                        show: {
                            type: "pop",
                            duration: 400
                        },
                        hide: {
                            type: "pop",
                            to: {
                                opacity: 0,
                                scale: 0
                            },
                            from: {
                                opacity: 1,
                                scale: 1
                            },
                            duration: 400
                        }
                    },
                    showingAction: null,
                    shownAction: null,
                    hiddingAction: null,
                    hiddenAction: null,
                    width: function() {
                        return $(window).width() * 0.8
                    },
                    height: function() {
                        return $(window).height() * 0.8
                    },
                    targetContainer: undefined
                })
        },
        _init: function() {
            this.callBase();
            this._actions = {};
            this._deferredAnimate = undefined;
            this._attachCloseOnOutsideClickHandler();
            this._windowResizeCallback = $.proxy(this._refresh, this);
            utils.windowResizeCallbacks.add(this._windowResizeCallback);
            this._$container = $("<div />").addClass(OVERLAY_CONTENT_CLASS)
        },
        _initOptions: function(options) {
            this._setTarget(options.targetContainer);
            this._setPositionOf(this._$target);
            this.callBase(options)
        },
        _setTarget: function(targetContainer) {
            targetContainer = targetContainer !== undefined ? targetContainer : DX.overlayTargetContainer() || defaultTargetContainer;
            var $element = this._element(),
                $target = $element.closest(targetContainer);
            if (!$target.length)
                $target = $(targetContainer);
            this._$target = $target.length ? $target : $element.parent()
        },
        _setPositionOf: function(target) {
            this.option("position.of", target)
        },
        _attachCloseOnOutsideClickHandler: function() {
            var self = this,
                eventNames = self._eventHelper.eventName("start");
            $(document).on(eventNames, function(e) {
                var closeOnOutsideClick = self.option("closeOnOutsideClick"),
                    visible = self.option("visible");
                if (closeOnOutsideClick && visible) {
                    var containerDomElement = self._$container.get(0),
                        outsideClick = e.target !== containerDomElement && !$.contains(containerDomElement, e.target),
                        showingEvent = Math.abs($.now() - self._showTimestamp) < OVERLAY_SHOW_EVENT_TOLERANCE;
                    if (outsideClick && !showingEvent)
                        self.hide()
                }
            })
        },
        _render: function() {
            var $element = this._element().addClass(OVERLAY_CLASS);
            this.callBase();
            this._$container.append($element.contents()).appendTo($element);
            this._needRenderOnShow = true;
            this._refresh();
            this._renderActions()
        },
        _refresh: function() {
            this._element().toggleClass(OVERLAY_MODAL_CLASS + " " + OVERLAY_SHADER_CLASS, this.option("shading"));
            this._renderDimensions();
            this._renderVisibility()
        },
        _renderActions: function() {
            var self = this;
            $.each(ACTIONS, function(index, itemAction) {
                self._actions[itemAction] = self._createActionByOption(itemAction)
            })
        },
        _dispose: function() {
            DX.fx.stop(this._$container);
            utils.windowResizeCallbacks.remove(this._windowResizeCallback);
            if (this.closeCallback)
                DX.backButtonCallback.remove(this.closeCallback);
            this.callBase()
        },
        _renderContent: function() {
            this._templates.template.render(this.content());
            this._moveToTargetContainer()
        },
        _moveToTargetContainer: function() {
            if (!this._$target)
                return;
            this._element().appendTo(this._$target)
        },
        _renderContentIfNeed: function() {
            if (this._needRenderOnShow) {
                this._renderContent();
                this._needRenderOnShow = false
            }
        },
        _renderDimensions: function() {
            this._$container.width(this.option("width")).height(this.option("height"))
        },
        _renderVisibility: function() {
            var visible = this.option("visible");
            DX.fx.stop(this._$container, true);
            if (visible) {
                this._renderContentIfNeed();
                this._renderPosition()
            }
            this._toggleVisibility(visible)
        },
        _renderVisibilityAnimate: function() {
            var visible = this.option("visible");
            if (visible)
                this._showTimestamp = $.now();
            DX.fx.stop(this._$container, true);
            if (visible)
                this._makeVisible();
            else
                this._makeHidden()
        },
        _makeVisible: function() {
            var self = this,
                animation = self.option("animation") || {};
            self._actions.showingAction();
            self._renderContentIfNeed();
            self._renderPosition();
            self._toggleVisibility(true);
            if (animation.show) {
                var animationComplete = animation.show.complete || $.noop;
                self._animate($.extend({}, animation.show, {complete: function() {
                        animationComplete();
                        self._notifyShowComplete()
                    }}))
            }
            else
                self._notifyShowComplete()
        },
        _makeHidden: function() {
            var self = this,
                animation = this.option("animation") || {};
            self._actions.hiddingAction();
            if (animation.hide) {
                var animationComplete = animation.hide.complete || $.noop;
                self._animate($.extend({}, animation.hide, {complete: function() {
                        self._toggleVisibility(false);
                        animationComplete();
                        self._cleanupAnimation().done(function() {
                            self._notifyHideComplete()
                        })
                    }}))
            }
            else {
                self._toggleVisibility(false);
                self._notifyHideComplete()
            }
        },
        _notifyShowComplete: function() {
            this._actions.shownAction();
            if (this._deferredAnimate)
                this._deferredAnimate.resolveWith(this)
        },
        _notifyHideComplete: function() {
            this._actions.hiddenAction();
            if (this._deferredAnimate)
                this._deferredAnimate.resolveWith(this)
        },
        _renderPosition: function() {
            var $element = this._element().show();
            if (this.option("shading")) {
                DX.position($element, {
                    my: "top left",
                    at: "top left",
                    of: this._$target
                });
                $element.css({
                    width: this._$target.outerWidth(),
                    height: this._$target.outerHeight()
                })
            }
            DX.position(this._$container, this.option("position"))
        },
        _cleanupAnimation: function() {
            var animation = this.option("animation"),
                to;
            if (!animation)
                return $.Deferred().resolve();
            to = animation.hide && animation.hide.from || animation.show && animation.show.to;
            if (to)
                return DX.fx.animate(this._$container, {
                        duration: 0,
                        type: animation.hide.type,
                        to: to
                    });
            return $.Deferred().resolve()
        },
        _toggleVisibility: function(visible) {
            this._element().toggle(visible);
            this._element().toggleClass(OVERLAY_SHADER_CLASS, this.option("shading") && visible)
        },
        _animate: function(animation) {
            if ($.isPlainObject(animation))
                DX.fx.animate(this._$container, animation)
        },
        _optionChanged: function(name, value) {
            if (name === "visible")
                this._renderVisibilityAnimate();
            else if ($.inArray(name, ACTIONS) > -1)
                this._renderActions();
            else if (name === "targetContainer") {
                this._setTarget(value);
                this._moveToTargetContainer();
                this._refresh()
            }
            else if (name !== "closeOnOutsideClick")
                this._refresh()
        },
        toggle: function(showing) {
            showing = showing === undefined ? !this.option("visible") : showing;
            if (showing) {
                this.closeCallback = $.proxy(this.hide, this);
                DX.backButtonCallback.add(this.closeCallback)
            }
            else if (this.closeCallback)
                DX.backButtonCallback.remove(this.closeCallback);
            if (showing === this.option("visible"))
                return $.Deferred().resolve().promise();
            this._deferredAnimate = $.Deferred();
            this.option("visible", showing);
            return this._deferredAnimate.promise()
        },
        show: function() {
            return this.toggle(true)
        },
        hide: function() {
            return this.toggle(false)
        },
        content: function() {
            return this._$container
        }
    }));
    ui.dxOverlay.defaultTargetContainer = function(targetContainer) {
        if (arguments.length)
            defaultTargetContainer = targetContainer;
        return defaultTargetContainer
    };
    ui.dxOverlay.__internals = {
        OVERLAY_SHOW_EVENT_TOLERANCE: OVERLAY_SHOW_EVENT_TOLERANCE,
        OVERLAY_CLASS: OVERLAY_CLASS,
        OVERLAY_CONTENT_CLASS: OVERLAY_CONTENT_CLASS,
        OVERLAY_SHADER_CLASS: OVERLAY_SHADER_CLASS,
        OVERLAY_MODAL_CLASS: OVERLAY_MODAL_CLASS
    }
})(jQuery, DevExpress);

// Module widgets, file ui.toast.js

(function($, DX, undefined) {
    var ui = DX.ui;
    var TOAST_CLASS = "dx-toast",
        TOAST_CLASS_PREFIX = TOAST_CLASS + "-",
        TOAST_CONTENT_CLASS = TOAST_CLASS_PREFIX + "content",
        TOAST_MESSAGE_CLASS = TOAST_CLASS_PREFIX + "message",
        TOAST_ICON_CLASS = TOAST_CLASS_PREFIX + "icon",
        WIDGET_NAME = "dxToast",
        toastTypes = ["info", "warning", "error", "success"];
    ui.registerComponent(WIDGET_NAME, ui.dxOverlay.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    message: "",
                    type: "info",
                    displayTime: 2000,
                    position: {
                        my: "bottom center",
                        at: "bottom center",
                        of: window,
                        offset: "0 -20"
                    },
                    animation: {
                        show: {
                            type: "fade",
                            duration: 400,
                            to: 1
                        },
                        hide: {
                            type: "fade",
                            duration: 400,
                            to: 0
                        }
                    },
                    shading: false,
                    height: "auto"
                })
        },
        _setPositionOf: $.noop,
        _renderContent: function() {
            if (this.option("message"))
                this._message = $("<div>").addClass(TOAST_MESSAGE_CLASS).text(this.option("message")).appendTo(this.content());
            if ($.inArray(this.option("type").toLowerCase(), toastTypes) > -1)
                this.content().prepend($("<div>").addClass(TOAST_ICON_CLASS));
            this.callBase()
        },
        _render: function() {
            this.callBase();
            this._element().addClass(TOAST_CLASS);
            this._$container.addClass(TOAST_CLASS_PREFIX + String(this.option("type")).toLowerCase());
            this.content().addClass(TOAST_CONTENT_CLASS).css("opacity", 0)
        },
        _renderVisibilityAnimate: function() {
            this.callBase.apply(this, arguments);
            if (this.option("visible")) {
                clearTimeout(this._hideTimeout);
                this._hideTimeout = setTimeout($.proxy(function() {
                    this.hide()
                }, this), this.option("displayTime"))
            }
        },
        _dispose: function() {
            clearTimeout(this._hideTimeout);
            this.callBase()
        },
        _optionChanged: function(name, value, prevValue) {
            if (name === "type") {
                this._$container.removeClass(TOAST_CLASS_PREFIX + prevValue);
                this._$container.addClass(TOAST_CLASS_PREFIX + String(value).toLowerCase());
                return
            }
            if (name === "message" && this._message)
                this._message.text(value);
            this.callBase.apply(this, arguments)
        }
    }));
    ui.dxToast.__internals = {
        TOAST_CLASS: TOAST_CLASS,
        TOAST_CONTENT_CLASS: TOAST_CONTENT_CLASS,
        TOAST_MESSAGE_CLASS: TOAST_MESSAGE_CLASS,
        TOAST_ICON_CLASS: TOAST_ICON_CLASS,
        TOAST_CLASS_PREFIX: TOAST_CLASS_PREFIX,
        WIDGET_NAME: WIDGET_NAME
    }
})(jQuery, DevExpress);

// Module widgets, file ui.popup.js

(function($, DX, undefined) {
    var ui = DX.ui;
    var POPUP_CLASS = "dx-popup",
        POPUP_CONTENT_CLASS = POPUP_CLASS + "-content",
        POPUP_FULL_SCREEN_CLASS = POPUP_CLASS + "-fullscreen",
        POPUP_TITLE_CLASS = POPUP_CLASS + "-title";
    ui.registerComponent("dxPopup", ui.dxOverlay.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    title: "",
                    showTitle: true,
                    fullScreen: false
                })
        },
        _init: function() {
            this.callBase()
        },
        _render: function() {
            this._$container.toggleClass(POPUP_FULL_SCREEN_CLASS, this.option("fullScreen"));
            this._$content = this._$container.wrapInner($("<div />").addClass(POPUP_CONTENT_CLASS)).children().eq(0);
            this.callBase();
            this._setTitle();
            this._element().addClass(POPUP_CLASS)
        },
        _setTitle: function() {
            var $title = this._element().find("." + POPUP_TITLE_CLASS);
            if (this.option("showTitle") && !$title.length) {
                this._$title = $("<div />").addClass(POPUP_TITLE_CLASS);
                this._$container.prepend(this._$title);
                this._renderTitle()
            }
            else if ($title.length)
                $title.remove()
        },
        _renderContent: function() {
            var contentTemplate = this._templates.content || this._templates.template;
            contentTemplate.render(this._$content);
            this._moveToTargetContainer()
        },
        _renderDimensions: function() {
            if (this.option("fullScreen"))
                this._$container.css({
                    width: "100%",
                    height: "100%"
                });
            else
                this.callBase()
        },
        _renderPosition: function() {
            if (this.option("fullScreen"))
                this._$container.position(0, 0);
            else
                this.callBase()
        },
        _renderTitle: function() {
            if (!this.option("showTitle"))
                return;
            var titleTemplate = this._templates.title;
            if (titleTemplate)
                titleTemplate.render(this._$title);
            else
                this._defaultTitleRender()
        },
        _defaultTitleRender: function() {
            this._$title.text(this.option("title"))
        },
        _optionChanged: function(name, value) {
            switch (name) {
                case"showTitle":
                    this._setTitle();
                    break;
                case"title":
                    this._renderTitle();
                    break;
                case"fullScreen":
                    this._$container.toggleClass(POPUP_FULL_SCREEN_CLASS, value);
                    this.callBase.apply(this, arguments);
                    break;
                default:
                    this.callBase.apply(this, arguments)
            }
        },
        content: function() {
            return this._$content
        }
    }));
    ui.dxPopup.__internals = {
        POPUP_CLASS: POPUP_CLASS,
        POPUP_CONTENT_CLASS: POPUP_CONTENT_CLASS,
        POPUP_FULL_SCREEN_CLASS: POPUP_FULL_SCREEN_CLASS,
        POPUP_TITLE_CLASS: POPUP_TITLE_CLASS
    }
})(jQuery, DevExpress);

// Module widgets, file ui.loadIndicator.js

(function($, DX, undefined) {
    var ui = DX.ui;
    var LOADINDICATOR_CLASS = "dx-loadindicator",
        LOADINDICATOR_WRAPPER = LOADINDICATOR_CLASS + "-wrapper",
        LOADINDICATOR_ICON = LOADINDICATOR_CLASS + "-icon",
        LOADINDICATOR_SEGMENT = LOADINDICATOR_CLASS + "-segment",
        LOADINDICATOR_SEGMENT_N = LOADINDICATOR_CLASS + "-segment",
        LOADINDICATOR_SEGMENT_WIN8 = LOADINDICATOR_CLASS + "-win8-segment",
        LOADINDICATOR_SEGMENT_N_WIN8 = LOADINDICATOR_CLASS + "-win8-segment",
        LOADINDICATOR_INNER_SEGMENT_WIN8 = LOADINDICATOR_CLASS + "-win8-inner-segment",
        LOADINDICATOR_IMAGE = LOADINDICATOR_CLASS + "-image",
        LOADINDICATOR_SIZES = ["small", "medium", "large"];
    ui.registerComponent("dxLoadIndicator", ui.Widget.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    visible: true,
                    size: ""
                })
        },
        _render: function() {
            this.callBase();
            this._element().addClass(LOADINDICATOR_CLASS);
            this._setSize();
            if (DX.support.animation)
                this._renderMarkupForAnimation();
            else
                this._renderMarkupForImage()
        },
        _renderMarkupForAnimation: function() {
            var indicator = $("<div>").addClass(LOADINDICATOR_ICON);
            indicator.append($("<div>").addClass(LOADINDICATOR_SEGMENT).addClass(LOADINDICATOR_SEGMENT_N + "0"));
            for (var i = 15; i > 0; --i)
                indicator.append($("<div>").addClass(LOADINDICATOR_SEGMENT).addClass(LOADINDICATOR_SEGMENT_N + i));
            for (var i = 1; i <= 5; ++i)
                indicator.append($("<div>").addClass(LOADINDICATOR_SEGMENT_WIN8).addClass(LOADINDICATOR_SEGMENT_N_WIN8 + i).append($("<div>").addClass(LOADINDICATOR_INNER_SEGMENT_WIN8)));
            $("<div>").addClass(LOADINDICATOR_WRAPPER).append(indicator).appendTo(this._element())
        },
        _renderMarkupForImage: function() {
            var size = this.option("size");
            if (size === "small" || size === "large")
                this._element().addClass(LOADINDICATOR_IMAGE + "-" + size);
            else
                this._element().addClass(LOADINDICATOR_IMAGE)
        },
        _setSize: function() {
            var size = this.option("size");
            if (size && $.inArray(size, LOADINDICATOR_SIZES) !== -1)
                this._element().addClass(LOADINDICATOR_CLASS + "-" + size)
        },
        _optionChanged: function(name) {
            switch (name) {
                case"size":
                    this._setSize();
                    break;
                default:
                    this.callBase.apply(this, arguments)
            }
        }
    }))
})(jQuery, DevExpress);

// Module widgets, file ui.loadPanel.js

(function($, DX, undefined) {
    var ui = DX.ui;
    var LOADPANEL_CLASS = "dx-loadpanel",
        LOADPANEL_MESSAGE_CLASS = LOADPANEL_CLASS + "-message",
        LOADPANEL_CONTENT_CLASS = LOADPANEL_CLASS + "-content";
    ui.registerComponent("dxLoadPanel", ui.dxOverlay.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    message: "Loading...",
                    width: 200,
                    height: 70,
                    animation: null
                })
        },
        _render: function() {
            this.content().addClass(LOADPANEL_CONTENT_CLASS);
            this.callBase();
            this._element().addClass(LOADPANEL_CLASS);
            var $image = $("<div>").dxLoadIndicator();
            var $message = $("<div>").addClass(LOADPANEL_MESSAGE_CLASS).text(this.option("message"));
            this.content().append($image).append($message)
        },
        _optionChanged: function(name, value) {
            switch (name) {
                case"message":
                    this.content().find("." + LOADPANEL_MESSAGE_CLASS).text(value);
                    break;
                default:
                    this.callBase.apply(this, arguments)
            }
        }
    }));
    ui.dxLoadPanel.__internals = {
        LOADPANEL_CLASS: LOADPANEL_CLASS,
        LOADPANEL_MESSAGE_CLASS: LOADPANEL_MESSAGE_CLASS,
        LOADPANEL_CONTENT_CLASS: LOADPANEL_CONTENT_CLASS
    }
})(jQuery, DevExpress);

// Module widgets, file ui.lookup.js

(function($, DX, undefined) {
    var ui = DX.ui;
    var LOOKUP_CLASS = "dx-lookup",
        LOOKUP_SELECTED_CLASS = LOOKUP_CLASS + "-selected",
        LOOKUP_SEARCH_CLASS = LOOKUP_CLASS + "-search",
        LOOKUP_FIELD_CLASS = LOOKUP_CLASS + "-field",
        LOOKUP_POPUP_CLASS = LOOKUP_CLASS + "-popup",
        LOOKUP_POPUP_SEARCH_CLASS = LOOKUP_POPUP_CLASS + "-search",
        TOOLBAR_LEFT_CLASS = "dx-toolbar-left",
        LIST_ITEM_SELECTOR = ".dx-list-item",
        LIST_ITEM_DATA_KEY = "dxListItemData",
        POPUP_HIDE_TIMEOUT = 200;
    ui.registerComponent("dxLookup", ui.Widget.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    dataSource: null,
                    value: undefined,
                    displayValue: undefined,
                    title: "",
                    valueExpr: null,
                    displayExpr: "this",
                    placeholder: "Select...",
                    searchEnabled: true,
                    searchTimeout: 1000,
                    minFilterLength: 0,
                    fullScreen: false,
                    valueChangeAction: null,
                    hideCancelButton: false
                })
        },
        _init: function() {
            this.callBase();
            this._initDataSource();
            this._checkExceptions();
            this._searchTimer = null;
            this._compileValueGetter();
            this._compileDisplayGetter();
            this._createEventActions();
            if (this._dataSource)
                this._dataSourceOriginalFilter = this._dataSource.filter();
            else
                this._itemsToDataSource()
        },
        _checkExceptions: function() {
            if (this._dataSource && this._dataSource._mapFunc)
                throw Error("Data source with enabled map is not allowed in the lookup");
        },
        _render: function() {
            this.callBase();
            this._element().addClass(LOOKUP_CLASS);
            this._renderField();
            this._calcSelectedItem($.proxy(this._setFieldText, this));
            this._renderPopup();
            this._renderSearch();
            this._renderList();
            if (this.option("hideCancelButton")) {
                this._popup.content().removeClass("dx-lookup-cancel");
                this._popup.content().children(".dx-lookup-cancel").remove()
            }
            else
                this._renderCancel()
        },
        _renderField: function() {
            var fieldClickAction = this._createAction(this._handleFieldClick);
            this._field = $("<div/>").addClass(LOOKUP_FIELD_CLASS).appendTo(this._element()).on(this._eventHelper.eventName("click"), function(e) {
                fieldClickAction({jQueryEvent: e})
            })
        },
        _renderPopup: function() {
            this._popup = $("<div/>").addClass(LOOKUP_POPUP_CLASS).toggleClass(LOOKUP_POPUP_SEARCH_CLASS, this.option("searchEnabled")).appendTo(this._element()).dxPopup({
                title: this.option("title"),
                fullScreen: this.option("fullScreen")
            }).data("dxPopup")
        },
        _renderSearch: function() {
            this._search = $("<div/>").addClass(LOOKUP_SEARCH_CLASS).dxTextBox({
                mode: "search",
                placeholder: "Search",
                valueUpdateEvent: "change keypress paste focus textInput input",
                valueUpdateAction: $.proxy(this._searchChangedHandler, this)
            }).toggle(this.option("searchEnabled")).appendTo(this._popup.content())
        },
        _renderList: function() {
            var self = this;
            self._list = $("<div/>").appendTo(self._popup.content()).dxList({
                dataSource: null,
                itemClickAction: function(e) {
                    self._toggleSelectedClass(e.jQueryEvent);
                    self._updateOptions(e)
                },
                itemRender: $.proxy(self._displayGetter, self),
                itemRenderedAction: function(e) {
                    self._setSelectedClass(e.itemElement, e.itemData)
                }
            }).data("dxList")
        },
        _renderCancel: function() {
            var button = $("<div/>").addClass("dx-lookup-cancel").dxButton({
                    text: "Cancel",
                    clickAction: $.proxy(function() {
                        this._hidePopup()
                    }, this)
                });
            this._popup.content().addClass("dx-lookup-cancel");
            if (DX.devices.current().ios)
                $("<div />").addClass(TOOLBAR_LEFT_CLASS).appendTo(this._popup._$title).prepend(button);
            else
                button.appendTo(this._popup.content())
        },
        _toggleSelectedClass: function(e) {
            var selectedItem = $("." + LOOKUP_SELECTED_CLASS);
            if (selectedItem.length)
                selectedItem.removeClass(LOOKUP_SELECTED_CLASS);
            $(e.target).closest(LIST_ITEM_SELECTOR).addClass(LOOKUP_SELECTED_CLASS)
        },
        _hidePopup: function() {
            this._popup.hide()
        },
        _updateOptions: function(e) {
            this.option("value", this._valueGetter(e.itemData));
            setTimeout($.proxy(this._hidePopup, this), POPUP_HIDE_TIMEOUT);
            this._setFieldText(this._displayGetter(e.itemData))
        },
        _handleFieldClick: function(args) {
            var self = args.component;
            self._setListDataSource();
            self._popup.show()
        },
        _getValueGetterExpr: function() {
            return this.option("valueExpr") || this._dataSource && this._dataSource._store._key || "this"
        },
        _compileValueGetter: function() {
            this._valueGetter = DX.data.utils.compileGetter(this._getValueGetterExpr())
        },
        _compileDisplayGetter: function() {
            this._displayGetter = DX.data.utils.compileGetter(this.option("displayExpr"))
        },
        _itemsToDataSource: function() {
            this._dataSource = new DX.data.ArrayStore(this.option("items")).toDataSource({paginate: false})
        },
        _createEventActions: function() {
            this._valueChangeAction = this._createActionByOption("valueChangeAction")
        },
        _optionChanged: function(name) {
            var self = this;
            this._checkExceptions();
            switch (name) {
                case"value":
                    this._calcSelectedItem(function() {
                        self._valueChangeAction({selectedItem: self._selectedItem});
                        self._compileValueGetter();
                        self._compileDisplayGetter();
                        self._refreshSelected();
                        self._setFieldText()
                    });
                    break;
                case"valueExpr":
                    this._compileValueGetter();
                    this._compileDisplayGetter();
                    this._refreshSelected();
                    this._setFieldText();
                    break;
                case"displayExpr":
                    if (name === "displayExpr") {
                        this._compileDisplayGetter();
                        this._list.option("itemRender", $.proxy(this._displayGetter, this))
                    }
                    this._refreshSelected();
                    this._setFieldText();
                    break;
                case"displayValue":
                    break;
                case"items":
                case"dataSource":
                    if (name === "items")
                        this._itemsToDataSource();
                    else
                        this._initDataSource();
                    this._setListDataSource(true);
                    if (this._dataSource)
                        this._dataSourceOriginalFilter = this._dataSource.filter();
                    this._compileValueGetter();
                    this._calcSelectedItem(function() {
                        self._setFieldText()
                    });
                    break;
                case"searchEnabled":
                    this._search.toggle(this.option("searchEnabled"));
                    this._popup.content().toggleClass(LOOKUP_POPUP_SEARCH_CLASS, this.option("searchEnabled"));
                    break;
                case"minFilterLength":
                    this._setListDataSource();
                    this._setFieldText();
                    this._searchChangedHandler();
                    break;
                case"placeholder":
                    this._setFieldText();
                    break;
                case"title":
                    this._popup.option("title", this.option("title"));
                    break;
                case"fullScreen":
                    this._popup.option("fullScreen", this.option("fullScreen"));
                    break;
                case"valueChangeAction":
                    this._createEventActions();
                    break;
                default:
                    this.callBase.apply(this, arguments)
            }
        },
        _setListDataSource: function(force) {
            var needsToLoad = this._search.data("dxTextBox").option("value").length >= this.option("minFilterLength"),
                dataSourceLoaded = !!this._list.option("dataSource"),
                skip = needsToLoad === dataSourceLoaded;
            if (!force && skip)
                return;
            this._list.option("dataSource", needsToLoad ? this._dataSource : null);
            if (!needsToLoad)
                this._list.option("items", undefined)
        },
        _handleDataSourceChanged: function(items) {
            var self = this;
            this._calcSelectedItem(function() {
                self._setFieldText()
            })
        },
        _clean: function() {
            if (this._popup)
                this._popup._element().remove();
            this.callBase()
        },
        _dispose: function() {
            clearTimeout(this._searchTimer);
            if (this._dataSource)
                this._dataSource.filter(this._dataSourceOriginalFilter);
            $(window).off(this._eventHelper.eventName("popstate"));
            this.callBase()
        },
        _searchChangedHandler: function() {
            var searchValue = this._search.data("dxTextBox").option("value"),
                needsToLoad = searchValue.length >= this.option("minFilterLength");
            clearTimeout(this._searchTimer);
            this._setListDataSource();
            if (!needsToLoad)
                return;
            if (this.option("searchTimeout"))
                this._searchTimer = setTimeout($.proxy(this._doSearch, this, searchValue), this.option("searchTimeout"));
            else
                this._doSearch(searchValue)
        },
        _doSearch: function(searchValue) {
            if (!this._dataSource)
                return;
            if (!arguments.length)
                searchValue = this.option("searchEnabled") ? this._search.data("dxTextBox").option("value") : "";
            this._filterStore(searchValue);
            this._list.update(true)
        },
        _filterStore: function(searchValue) {
            this._dataSource.reload({
                searchString: searchValue,
                searchField: this.option("displayExpr")
            })
        },
        _getDisplayText: function() {
            if (this.option("value") === undefined || !this._dataSource)
                return this.option("placeholder");
            return this._displayGetter(this._selectedItem) || this.option("placeholder")
        },
        _setFieldText: function(text) {
            if (!arguments.length)
                text = this._getDisplayText();
            this._field.text(text);
            this.option("displayValue", text)
        },
        _calcSelectedItem: function(callback) {
            var self = this,
                value = self.option("value");
            if (!self._dataSource || value === undefined) {
                self._selectedItem = undefined;
                callback();
                return
            }
            if (value === self._valueGetter(self._selectedItem)) {
                callback();
                return
            }
            self._dataSource.lookup({
                key: value,
                lookupExpression: self._getValueGetterExpr(),
                lookupGetter: self._valueGetter
            }).done(function(result) {
                self._selectedItem = result;
                callback()
            })
        },
        _refreshSelected: function() {
            var self = this;
            $.each(this._list._element().find(LIST_ITEM_SELECTOR), function() {
                var item = $(this);
                self._setSelectedClass(item, item.data(LIST_ITEM_DATA_KEY))
            })
        },
        _setSelectedClass: function(item, itemData) {
            var selected = this._valueGetter(itemData) === this.option("value");
            item.toggleClass(LOOKUP_SELECTED_CLASS, selected)
        }
    }).include(ui.DataHelperMixin))
})(jQuery, DevExpress);

// Module widgets, file ui.actionSheet.js

(function($, DX, undefined) {
    var ui = DX.ui;
    var ACTION_SHEET_CLASS = "dx-action-sheet",
        ACTION_SHEET_CONTAINER_CLASS = "dx-action-sheet-container",
        ACTION_SHEET_POPUP_CLASS = "dx-action-sheet-popup",
        ACTION_SHEET_CANCEL_BUTTON_CLASS = "dx-action-sheet-cancel",
        ACTION_SHEET_ITEM_CLASS = "dx-action-sheet-item",
        POPUP_TITLE_SELECTOR = ".dx-popup-title",
        ACTION_SHEET_ITEM_DATA_KEY = "dxActionSheetItemData";
    ui.registerComponent("dxActionSheet", ui.CollectionContainerWidget.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    title: "",
                    showTitle: true,
                    cancelText: "Cancel",
                    noDataText: "",
                    visible: false
                })
        },
        _init: function() {
            this.callBase();
            this._itemContainerElement = $("<div/>").addClass(ACTION_SHEET_CONTAINER_CLASS);
            this._element().addClass(ACTION_SHEET_CLASS)
        },
        _clean: function() {
            if (this._popup)
                this._popup.content().empty();
            this.callBase()
        },
        _render: function() {
            this._popup = this._renderPopup();
            this._popup.content().append(this._itemContainerElement);
            this._cancel = this._renderCancel();
            this._popupTitle = $(POPUP_TITLE_SELECTOR, this._element()).toggle(this.option("showTitle"));
            this.callBase();
            this._togglePopup(this.option("visible"))
        },
        _renderPopup: function() {
            return $("<div/>").addClass(ACTION_SHEET_POPUP_CLASS).appendTo(this._element()).dxPopup({
                    title: this.option("title"),
                    position: {
                        my: "bottom",
                        at: "bottom",
                        of: window
                    },
                    animation: {
                        show: {
                            type: "slide",
                            duration: 400,
                            from: {top: $("body").height()}
                        },
                        hide: {
                            type: "slide",
                            duration: 400,
                            to: {top: $("body").height()}
                        }
                    },
                    width: "100%",
                    height: "auto"
                }).data("dxPopup")
        },
        _renderCancel: function() {
            return $("<div/>").addClass(ACTION_SHEET_CANCEL_BUTTON_CLASS).appendTo(this._popup.content()).dxButton({
                    text: this.option("cancelText"),
                    clickAction: $.proxy(this.hide, this)
                }).data("dxButton")
        },
        _handleItemClick: function(e) {
            var clickedButton = $(e.target).closest(this._itemSelector()).data("dxButton");
            if (!clickedButton.option("disabled"))
                this.hide();
            this.callBase(e)
        },
        _itemRenderDefault: function(item, index, itemElement) {
            itemElement.dxButton(item)
        },
        _itemContainer: function() {
            return this._itemContainerElement
        },
        _itemClass: function() {
            return ACTION_SHEET_ITEM_CLASS
        },
        _itemDataKey: function() {
            return ACTION_SHEET_ITEM_DATA_KEY
        },
        _toggleVisibility: function(){},
        _togglePopup: function(visible) {
            var self = this;
            self._popup.toggle(visible).done(function() {
                if (self._deferredAnimate)
                    self._deferredAnimate.resolveWith(self)
            })
        },
        _optionChanged: function(name, value) {
            switch (name) {
                case"visible":
                    this._togglePopup(value);
                    break;
                case"title":
                    this._popup.option("title", value);
                    break;
                case"showTitle":
                    this._popupTitle.toggle(value);
                    break;
                case"cancelText":
                    this._cancel.option("text", value);
                    break;
                case"items":
                    this._attachClickEvent();
                    this._renderItems();
                    if (!this._dataSource)
                        this._renderEmptyMessage();
                    this._popup._refresh();
                    break;
                default:
                    this.callBase.apply(this, arguments)
            }
        },
        toggle: function(showing) {
            showing = showing === undefined ? !this.option("visible") : showing;
            if (showing === this.option("visible"))
                return $.Deferred().resolve().promise();
            this._deferredAnimate = $.Deferred();
            this.option("visible", showing);
            return this._deferredAnimate.promise()
        },
        show: function() {
            return this.toggle(true)
        },
        hide: function() {
            return this.toggle(false)
        }
    }))
})(jQuery, DevExpress);

// Module widgets, file ui.map.js

(function($, DX, undefined) {
    var ui = DX.ui,
        utils = DX.utils,
        mapsInit = {},
        mapsHash = {},
        winJS = DX.support.winJS,
        _googleScriptReady = "_googleScriptReady",
        GOOGLE_URL = "https://maps.google.com/maps/api/js?v=3.9&sensor=false&callback=" + _googleScriptReady,
        _bingScriptReady = "_bingScriptReady",
        BING_URL = "https://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=7.0&s=1&onScriptLoad=" + _bingScriptReady,
        BING_LOCATOR_URL = "https://dev.virtualearth.net/REST/v1/Locations/",
        GOOGLE_STATIC_URL = "https://maps.google.com/maps/api/staticmap?",
        BING_LOCAL_FILES1 = "ms-appx:///Bing.Maps.JavaScript/js/veapicore.js",
        BING_LOCAL_FILES2 = "ms-appx:///Bing.Maps.JavaScript/js/veapiModules.js",
        BING_CREDENTIALS = "AhuxC0dQ1DBTNo8L-H9ToVMQStmizZzBJdraTSgCzDSWPsA1Qd8uIvFSflzxdaLH";
    var compare_objects = function(x, y) {
            if (x === y)
                return true;
            if (!(x instanceof Object) || !(y instanceof Object))
                return false;
            if (x.constructor !== y.constructor)
                return false;
            for (var p in x) {
                if (!x.hasOwnProperty(p))
                    continue;
                if (!y.hasOwnProperty(p))
                    return false;
                if (x[p] === y[p])
                    continue;
                if (typeof x[p] !== "object")
                    return false;
                if (!compare_objects(x[p], y[p]))
                    return false
            }
            for (p in y)
                if (y.hasOwnProperty(p) && !x.hasOwnProperty(p))
                    return false;
            return true
        };
    ui.registerComponent("dxMap", ui.Widget.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    location: {
                        lat: 0,
                        lng: 0
                    },
                    width: 300,
                    height: 300,
                    zoom: 1,
                    mapType: "roadmap",
                    provider: "google",
                    markers: [],
                    routes: []
                })
        },
        _init: function() {
            this.callBase();
            utils.windowResizeCallbacks.add(this._wrappedRenderMapHandle = $.proxy(this._renderMapHandle, this))
        },
        _clean: function() {
            var eventHelper = this._eventHelper;
            this.mapAdapter._clean();
            this._element().removeClass("dx-map").off(eventHelper.eventName("start"), this._removeGestures).empty()
        },
        _dispose: function() {
            this.callBase();
            utils.windowResizeCallbacks.remove(this._wrappedRenderMapHandle)
        },
        _removeGestures: function(e) {
            if (!e.button && this.mapAdapter.removeGesture && !DX.designMode)
                return false
        },
        _render: function() {
            this.callBase();
            this._element().addClass("dx-map");
            if (this.option("width"))
                this._element().css("width", this.option("width"));
            if (this.option("height"))
                this._element().css("height", this.option("height"));
            this._renderMapContainer();
            this._renderShield();
            var provider = winJS && this.option("provider") === "google" ? "bing" : this.option("provider");
            this.mapAdapter = new adapters[provider](this._mapContainer, this._options);
            var eventHelper = this._eventHelper;
            this._element().on(eventHelper.eventName("start"), $.proxy(this._removeGestures, this));
            this._initMap()
        },
        _initMap: function() {
            return this.mapAdapter._initMap(this)
        },
        _renderMapContainer: function() {
            this._mapContainer = $("<div />").addClass("dx-map-container").appendTo(this._element())
        },
        _renderShield: function() {
            if (!DX.designMode)
                return;
            $("<div />").addClass("dx-map-shield").appendTo(this._element())
        },
        _optionChanged: function(name, value, prevValue) {
            switch (name) {
                case"markers":
                    this.mapAdapter._renderMarkers(value, prevValue);
                    break;
                case"routes":
                    this.mapAdapter._renderRoutes(value, prevValue);
                    break;
                default:
                    this.callBase(name, value, prevValue)
            }
        },
        _renderMapHandle: function() {
            if (this.mapAdapter._renderMapHandle)
                this.mapAdapter._renderMapHandle()
        },
        addMarker: function() {
            var self = this,
                deferred = $.Deferred();
            self.mapAdapter.addMarker.apply(self.mapAdapter, arguments).done(function() {
                deferred.resolveWith(self)
            });
            return deferred.promise()
        },
        removeMarker: function() {
            this.mapAdapter.removeMarker.apply(this.mapAdapter, arguments)
        },
        addRoute: function() {
            var self = this,
                deferred = $.Deferred();
            self.mapAdapter.addRoute.apply(self.mapAdapter, arguments).done(function() {
                deferred.resolveWith(self)
            });
            return deferred.promise()
        },
        removeRoute: function() {
            this.mapAdapter.removeRoute.apply(this.mapAdapter, arguments)
        }
    }));
    var adapters = ui.dxMap.adapters = {},
        protoAdapter = DX.Class.inherit({
            ctor: function(rootElement, options) {
                this.rootElement = rootElement;
                this._options = options;
                this.map = null;
                this._markers = [];
                this._routes = []
            },
            _renderMarkers: function(newValue, oldValue) {
                var self = this,
                    markers = self._options.markers;
                newValue = newValue || markers || [];
                oldValue = oldValue || self._markers || [];
                if (!self.map)
                    return;
                $.each(oldValue, function() {
                    self.removeMarker(this)
                });
                self._markers = [];
                $.each(newValue, function() {
                    self.addMarker(this)
                })
            },
            _renderRoutes: function(newValue, oldValue) {
                var self = this,
                    routes = self._options.routes;
                newValue = newValue || routes || [];
                oldValue = oldValue || self._routes || [];
                if (!self.map)
                    return;
                $.each(oldValue, function() {
                    self.removeRoute(this)
                });
                self._routes = [];
                $.each(newValue, function() {
                    self.addRoute(this)
                })
            },
            _clean: function() {
                this._routes = [];
                this._markers = [];
                this.map = null
            }
        });
    adapters.google = protoAdapter.inherit({
        _getMapType: function(type) {
            var mapTypes = {
                    hybrid: google.maps.MapTypeId.HYBRID,
                    roadmap: google.maps.MapTypeId.ROADMAP,
                    satellite: google.maps.MapTypeId.SATELLITE,
                    terrain: google.maps.MapTypeId.TERRAIN
                };
            return mapTypes[type] || mapTypes.roadmap
        },
        _initMap: function(widgetInstance) {
            if (!mapsInit.google) {
                window[_googleScriptReady] = $.proxy(this._scriptReady, this);
                $.getScript(GOOGLE_URL);
                mapsInit.google = new $.Deferred
            }
            this._widgetInstance = widgetInstance;
            mapsInit.google.done($.proxy(this._renderMap, this));
            return mapsInit.google
        },
        _scriptReady: function() {
            try {
                delete window[_googleScriptReady]
            }
            catch(e) {
                window[_googleScriptReady] = undefined
            }
            mapsInit.google.resolve()
        },
        _renderMap: function() {
            var self = this,
                locationResolved = self._resolveLocation(self._options.location);
            var options = {
                    zoom: self._options.zoom,
                    center: new google.maps.LatLng(0, 0),
                    mapTypeId: self._getMapType(self._options.mapType)
                };
            self.map = new google.maps.Map(self.rootElement[0], options);
            self._bounds = new google.maps.LatLngBounds;
            self._renderRoutes();
            self._renderMarkers();
            $.when(locationResolved).done(function(location) {
                self.map.setCenter(location)
            })
        },
        _renderMapHandle: function() {
            if ("google" in window)
                google.maps.event.trigger(this.map, 'resize')
        },
        _resolveLocation: function(location) {
            var d = $.Deferred();
            if (typeof location === "string") {
                if (!mapsHash.google)
                    mapsHash.google = {};
                if (mapsHash.google[location]) {
                    d.resolve(mapsHash.google[location]);
                    return d.promise()
                }
                var geocoder = new google.maps.Geocoder;
                geocoder.geocode({address: location}, function(results, status) {
                    if (status === google.maps.GeocoderStatus.OK) {
                        mapsHash.google[location] = results[0].geometry.location;
                        d.resolve(mapsHash.google[location])
                    }
                })
            }
            else if ($.isPlainObject(location) && location.lat && location.lng)
                d.resolve(new google.maps.LatLng(location.lat, location.lng));
            else if ($.isArray(location))
                d.resolve(new google.maps.LatLng(location[0], location[1]));
            return d.promise()
        },
        tooltipByMarker: function(marker) {
            var isConfig = $.isPlainObject(marker);
            var result = $.grep(this._markers, function(value) {
                    return isConfig ? marker === value.options : marker === value.instance
                })[0];
            if (result)
                return result.tooltip
        },
        addMarker: function(options, callback) {
            var self = this,
                map = google.maps,
                locationResolved = self._resolveLocation(options.location);
            return $.when(locationResolved).done(function(location) {
                    self._bounds.extend(location);
                    var tooltip,
                        marker = new map.Marker({
                            position: location,
                            map: self.map,
                            title: options.text
                        });
                    if (options.tooltip)
                        self.addTooltip(options.tooltip, marker, function(infoWindow) {
                            tooltip = infoWindow
                        });
                    if (options.clickAction || tooltip) {
                        var markerClickAction = self._widgetInstance._createAction(options.clickAction || $.noop);
                        map.event.addListener(marker, "click", function(e) {
                            var result = markerClickAction(e);
                            if (result !== false && tooltip)
                                tooltip.open(self.map, marker)
                        })
                    }
                    self.map.setCenter(self._bounds.getCenter());
                    self.map.fitBounds(self._bounds);
                    if (callback)
                        callback.call(self, marker);
                    self._markers.push({
                        instance: marker,
                        tooltip: tooltip,
                        options: options
                    })
                })
        },
        removeMarker: function(point) {
            var self = this;
            if ($.isPlainObject(point))
                $.each(self._markers, function(index) {
                    if (compare_objects(this.options, point) || compare_objects(this, point)) {
                        if (this.tooltip)
                            this.tooltip.setMap(null);
                        this.instance.setMap(null);
                        self._markers.splice(index, 1);
                        return false
                    }
                });
            else if ($.isNumeric(point) && self._markers[point]) {
                var marker = self._markers[point];
                if (marker.tooltip)
                    marker.tooltip.setMap(null);
                marker.instance.setMap(null);
                self._markers.splice(point, 1)
            }
        },
        addRoute: function(options, callback) {
            var self = this,
                map = google.maps,
                directionsService = new map.DirectionsService;
            var rawPoints = $.map(options.locations, function(point) {
                    return self._resolveLocation(point)
                });
            return $.when.apply(self, rawPoints).done(function() {
                    var latLongPoints = $.makeArray(arguments),
                        origin = latLongPoints.shift(),
                        destination = latLongPoints.pop();
                    var waypoints = $.map(latLongPoints, function(rawPoint) {
                            return {
                                    location: rawPoint,
                                    stopover: true
                                }
                        });
                    var request = {
                            origin: origin,
                            destination: destination,
                            waypoints: waypoints,
                            optimizeWaypoints: true,
                            provideRouteAlternatives: true,
                            travelMode: map.TravelMode.DRIVING
                        };
                    var route = new map.DirectionsRenderer({suppressMarkers: true});
                    route.setMap(self.map);
                    self._routes.push({
                        instance: route,
                        options: options
                    });
                    directionsService.route(request, function(response, status) {
                        if (status === map.DirectionsStatus.OK)
                            route.setDirections(response);
                        else
                            self.removeRoute(route);
                        if (callback)
                            callback.call(self, response)
                    })
                })
        },
        removeRoute: function(route) {
            var self = this;
            if ($.isPlainObject(route))
                $.each(self._routes, function(index) {
                    if (compare_objects(this.options, route)) {
                        this.instance.setMap(null);
                        self._routes.splice(index, 1);
                        return false
                    }
                });
            else if ($.isNumeric(route) && self._routes[route]) {
                self._routes[route].instance.setMap(null);
                self._routes.splice(route, 1)
            }
        },
        addTooltip: function(options, marker, callback) {
            var self = this,
                map = google.maps,
                tooltipOptions = typeof options === "string" ? {content: options} : options;
            var infoWindow = new map.InfoWindow({content: tooltipOptions.content});
            if (tooltipOptions.close)
                map.event.addListener(infoWindow, "closeclick", function() {
                    tooltipOptions.close.call(self, infoWindow)
                });
            if (tooltipOptions.opened)
                infoWindow.open(self.map, marker);
            else
                infoWindow.close();
            if (!!callback)
                callback.call(self, infoWindow)
        },
        removeGesture: true
    });
    adapters.bing = protoAdapter.inherit({
        ctor: function(rootElement, options) {
            this.callBase(rootElement, options);
            BING_CREDENTIALS = options.credentials || BING_CREDENTIALS
        },
        _getMapType: function(type) {
            var mapTypes = {
                    roadmap: Microsoft.Maps.MapTypeId.road,
                    satellite: Microsoft.Maps.MapTypeId.birdseye
                };
            return mapTypes[type] || mapTypes.roadmap
        },
        _initMap: function(widgetInstance) {
            if (!mapsInit.bing) {
                mapsInit.bing = new $.Deferred;
                window[_bingScriptReady] = $.proxy(this._scriptReady, this);
                if (!winJS)
                    $.getScript(BING_URL);
                else
                    $.when($.getScript(BING_LOCAL_FILES1), $.getScript(BING_LOCAL_FILES2)).done(function() {
                        Microsoft.Maps.loadModule('Microsoft.Maps.Map', {callback: window[_bingScriptReady]})
                    })
            }
            this._widgetInstance = widgetInstance;
            mapsInit.bing.done($.proxy(this._renderMap, this));
            return mapsInit.bing
        },
        _scriptReady: function() {
            try {
                delete window[_bingScriptReady]
            }
            catch(e) {
                window[_bingScriptReady] = undefined
            }
            mapsInit.bing.resolve()
        },
        _resolveLocation: function(location) {
            var d = $.Deferred();
            if (!mapsHash.bing)
                mapsHash.bing = {};
            if (typeof location === "string") {
                if (mapsHash.bing[location]) {
                    d.resolve(mapsHash.bing[location]);
                    return d.promise()
                }
                var url = BING_LOCATOR_URL + location + "?output=json&key=" + BING_CREDENTIALS;
                $.getJSON(winJS ? url : url + "&jsonp=?").done(function(result) {
                    var boundsBox = result.resourceSets[0].resources[0].geocodePoints[0].coordinates,
                        point = new Microsoft.Maps.Location(boundsBox[0], boundsBox[1]);
                    mapsHash.bing[location] = point;
                    d.resolve(point)
                })
            }
            else if ($.isPlainObject(location) && location.lat && location.lng)
                d.resolve(new Microsoft.Maps.Location(location.lat, location.lng));
            else if ($.isArray(location))
                d.resolve(new Microsoft.Maps.Location(location[0], location[1]));
            return d.promise()
        },
        _renderMap: function() {
            var self = this,
                locationResolved = self._resolveLocation(self._options.location);
            var options = {
                    zoom: self._options.zoom,
                    mapTypeId: self._getMapType(self._options.mapType),
                    credentials: BING_CREDENTIALS
                };
            self.map = new Microsoft.Maps.Map(self.rootElement[0], options);
            $.when(locationResolved).done(function(location) {
                self.map.setView({center: location})
            });
            self._renderMarkers();
            self._renderRoutes()
        },
        addMarker: function(options, callback) {
            var self = this,
                tooltip,
                locationResolved = self._resolveLocation(options.location);
            return $.when(locationResolved).done(function(location) {
                    var marker = new Microsoft.Maps.Pushpin(location, null);
                    self.map.entities.push(marker);
                    if (options.tooltip) {
                        self.addTooltip(options.tooltip, marker, function(infoWindow) {
                            tooltip = infoWindow
                        });
                        marker.setOptions({infobox: tooltip})
                    }
                    if (options.clickAction || tooltip) {
                        var markerClickAction = self._widgetInstance._createAction(options.clickAction || $.noop);
                        Microsoft.Maps.Events.addHandler(marker, "click", function(e) {
                            var result = markerClickAction(e);
                            if (result !== false && tooltip)
                                tooltip.setOptions({
                                    location: marker.getLocation(),
                                    visible: true
                                })
                        })
                    }
                    if (callback)
                        callback.call(self, marker);
                    self._markers.push({
                        instance: marker,
                        tooltip: tooltip,
                        options: options
                    })
                })
        },
        removeMarker: function(point) {
            var self = this;
            if ($.isPlainObject(point))
                $.each(self._markers, function(index) {
                    if (compare_objects(this.options, point)) {
                        self.map.entities.remove(this.instance);
                        self._markers.splice(index, 1);
                        return false
                    }
                });
            else if ($.isNumeric(point) && self._markers[point]) {
                self.map.entities.remove(self._markers[point].instance);
                self._markers.splice(point, 1)
            }
        },
        addRoute: function(options, callback) {
            var self = this,
                directions = Microsoft.Maps.Directions;
            if (!directions) {
                Microsoft.Maps.loadModule('Microsoft.Maps.Directions', {callback: function() {
                        self.addRoute.call(self, options, callback)
                    }});
                return false
            }
            var rawPoints = $.map(options.locations, function(point) {
                    return self._resolveLocation(point)
                });
            return $.when.apply(self, rawPoints).done(function() {
                    var latLongPoints = $.makeArray(arguments),
                        route = new directions.DirectionsManager(self.map);
                    route.setRequestOptions({
                        routeMode: directions.RouteMode.driving,
                        displayRouteSelector: false
                    });
                    $.each(latLongPoints, function() {
                        var m_point = new directions.Waypoint({location: this});
                        route.addWaypoint(m_point)
                    });
                    route.calculateDirections();
                    if (callback)
                        callback.call(self, route);
                    self._routes.push({
                        instance: route,
                        options: options
                    })
                })
        },
        removeRoute: function(route) {
            var self = this;
            if ($.isPlainObject(route))
                $.each(self._routes, function(index) {
                    if (compare_objects(this.options, route)) {
                        self.map.entities.remove(this.instance);
                        self._routes.splice(index, 1);
                        return false
                    }
                });
            else if ($.isNumeric(route) && self._routes[route]) {
                var linkRoute = self._routes[route];
                self.map.entities.remove(linkRoute.instance);
                self._routes.splice(route, 1)
            }
        },
        addTooltip: function(options, marker, callback) {
            var self = this,
                tooltipOptions = typeof options === "string" ? {content: options} : options;
            var infoWindow = new Microsoft.Maps.Infobox(marker.getLocation(), {
                    description: tooltipOptions.content,
                    showCloseButton: true
                });
            infoWindow.setOptions({visible: !!tooltipOptions.opened});
            self.map.entities.push(infoWindow);
            if (!!callback)
                callback.call(self, infoWindow)
        },
        removeGesture: true
    });
    adapters.googleStatic = protoAdapter.inherit({
        _getMapType: adapters.google._getMapType,
        _initMap: function() {
            var d = $.Deferred();
            d.done($.proxy(this._renderMap, this));
            d.resolve();
            return d.promise()
        },
        _renderMap: function() {
            var root = this.rootElement,
                options = this._options,
                maptype = options.maptype,
                location = options.location,
                width = options.width || root.width(),
                height = options.height || root.height(),
                zoom = options.zoom,
                markers = options.markers,
                routes = options.routes,
                autoScale = options.autoScale,
                size = width + "x" + height,
                markersToString = "",
                routeToString = "";
            this.map = root;
            this._renderMarkers();
            this._renderRoutes();
            if (width === 0 || height === 0)
                return;
            $.each(markers || [], function(index, marker) {
                markersToString += "&markers=";
                if ($.isPlainObject(marker)) {
                    if (marker.color)
                        markersToString += "color:" + marker.color + "|";
                    if (marker.label)
                        markersToString += "label:" + marker.label + "|";
                    if (marker.size)
                        markersToString += "size:" + marker.size + "|";
                    if (marker.icon)
                        markersToString += "icon:" + marker.icon + "|";
                    markersToString += marker.location
                }
                else
                    markersToString += marker
            });
            $.each(routes || [], function(index, route) {
                routeToString += "&path=";
                if (route.color)
                    routeToString += "color:" + route.color + "|";
                if (route.weight)
                    routeToString += "weight:" + route.weight + "|";
                routeToString += route.locations.join("|")
            });
            var apiURL = GOOGLE_STATIC_URL + "maptype=" + maptype + "&size=" + size + "&sensor=false" + markersToString + routeToString;
            if (!autoScale)
                apiURL += "&center=" + location + "&zoom=" + zoom;
            root.css("background", "url('" + apiURL + "') no-repeat 0 0");
            if (this.width)
                root.css("width", width);
            if (this.height)
                root.css("height", height)
        },
        addMarker: function(options) {
            this._markers.push(options);
            return $.Deferred().resolve().promise()
        },
        removeMarker: function(point) {
            var self = this;
            if ($.isPlainObject(point))
                $.each(self._markers, function(index) {
                    if (compare_objects(this, point)) {
                        self._markers.splice(index, 1);
                        return false
                    }
                });
            else if ($.isNumeric(point) && self._markers[point])
                self._markers.splice(point, 1)
        },
        addRoute: function(options) {
            this._routes.push(options);
            return $.Deferred().resolve().promise()
        },
        removeRoute: function(route) {
            var self = this;
            if ($.isPlainObject(route))
                $.each(self._routes, function(index) {
                    if (this === route) {
                        self._routes.splice(index, 1);
                        return false
                    }
                });
            else if ($.isNumeric(route) && self._routes[route])
                self._routes.splice(route, 1)
        },
        addTooltip: function(options){},
        _clean: function() {
            this.callBase();
            this.rootElement.css("background-image", "none")
        }
    });
    ui.dxMap.__internals = {
        remapConstant: function(variable, newValue) {
            var allowedVars = ["GOOGLE_URL", "GOOGLE_STATIC_URL", "BING_LOCAL_FILES1", "BING_LOCAL_FILES2", "BING_URL", "BING_LOCATOR_URL", "BING_CREDENTIALS"];
            if ($.inArray(variable, allowedVars) !== -1)
                eval(variable + ' = newValue;')
        },
        mapsInit: mapsInit
    }
})(jQuery, DevExpress);

// Module widgets, file ui.autocomplete.js

(function($, DX, undefined) {
    var ui = DX.ui,
        utils = DX.utils;
    var KEY_DOWN = 40,
        KEY_UP = 38,
        KEY_ENTER = 13,
        KEY_ESC = 27,
        KEY_RIGHT = 39,
        KEY_TAB = 9,
        AUTOCOMPLETE_CLASS = "dx-autocomplete",
        AUTOCOMPLETE_POPUP = AUTOCOMPLETE_CLASS + "-popup",
        SELECTED_ITEM_CLASS = "dx-autocomplete-selected",
        SELECTED_ITEM_SELECTOR = "." + SELECTED_ITEM_CLASS,
        LIST_SELECTOR = ".dx-list",
        EDITBOX_INPUT_SELECTOR = ".dx-editbox-input",
        LIST_ITEM_SELECTOR = ".dx-list-item",
        LIST_ITEM_DATA_KEY = "dxListItemData",
        SEARCH_OPERATORS = ["startswith", "contains", "endwith", "notcontains"];
    ui.registerComponent("dxAutocomplete", ui.ContainerWidget.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    value: "",
                    items: [],
                    dataSource: new DevExpress.data.ArrayStore,
                    itemTemplate: "item",
                    itemRender: null,
                    minSearchLength: 1,
                    searchTimeout: 0,
                    placeholder: "",
                    filterOperator: "contains",
                    displayExpr: "this"
                })
        },
        _listElement: function() {
            return this._popup._element().find(LIST_SELECTOR)
        },
        _listItemElement: function() {
            return this._popup._element().find(LIST_ITEM_SELECTOR)
        },
        _listSelectedItemElement: function() {
            return this._popup._element().find(SELECTED_ITEM_SELECTOR)
        },
        _inputElement: function() {
            return this._element().find(EDITBOX_INPUT_SELECTOR)
        },
        _textboxElement: function() {
            return this._textbox._element()
        },
        _init: function() {
            this.callBase();
            this._validateFilterOperator();
            this._compileDisplayGetter()
        },
        _validateFilterOperator: function() {
            var filterOperator = this.option("filterOperator"),
                normalizedFilterOperator = filterOperator.toLowerCase();
            if ($.inArray(normalizedFilterOperator, SEARCH_OPERATORS) > -1)
                return;
            throw Error("Filter operator '" + filterOperator + "' is unavailable");
        },
        _compileDisplayGetter: function() {
            this._displayGetter = DX.data.utils.compileGetter(this.option("displayExpr"))
        },
        _render: function() {
            this.callBase();
            this._element().addClass(AUTOCOMPLETE_CLASS);
            this._renderTextbox();
            this._checkExceptions();
            this._renderPopup();
            this._renderList()
        },
        _renderTextbox: function() {
            this._textbox = $("<div />").dxTextBox({
                value: this.option("value"),
                placeholder: this.option("placeholder"),
                valueUpdateEvent: "keyup change",
                keyDownAction: $.proxy(this._handleTextboxKeyDown, this),
                keyUpAction: $.proxy(this._handleTextboxKeyUp, this),
                valueUpdateAction: $.proxy(this._updateValue, this)
            }).appendTo(this._element()).data("dxTextBox")
        },
        _handleTextboxKeyDown: function(e) {
            var $list = this._listElement(),
                preventedKeys = [KEY_TAB, KEY_UP, KEY_DOWN],
                key = e.jQueryEvent.which;
            if ($list.is(":hidden"))
                return;
            if ($.inArray(key, preventedKeys) > -1)
                e.jQueryEvent.preventDefault()
        },
        _updateValue: function() {
            var inputElement = this._inputElement();
            this.option("value", this._textbox.option("value"));
            inputElement.prop("selectionStart", this._caretPosition);
            inputElement.prop("selectionEnd", this._caretPosition)
        },
        _handleTextboxKeyUp: function(e) {
            var key = e.jQueryEvent.which;
            this._caretPosition = this._inputElement().prop("selectionStart");
            switch (key) {
                case KEY_DOWN:
                    this._handleTextboxDownKey();
                    break;
                case KEY_UP:
                    this._handleTextboxUpKey();
                    break;
                case KEY_ENTER:
                    this._handleTextboxEnterKey();
                    break;
                case KEY_RIGHT:
                case KEY_TAB:
                    this._handleTextboxCompleteKeys();
                    break;
                case KEY_ESC:
                    this._handleTextboxEscKey();
                    break;
                default:
                    return
            }
        },
        _handleTextboxDownKey: function() {
            var $selectedItem = this._listSelectedItemElement(),
                $nextItem;
            if ($selectedItem.length) {
                $nextItem = $selectedItem.next();
                $nextItem.addClass(SELECTED_ITEM_CLASS);
                $selectedItem.removeClass(SELECTED_ITEM_CLASS)
            }
            else
                this._listItemElement().first().addClass(SELECTED_ITEM_CLASS)
        },
        _handleTextboxUpKey: function() {
            var $selectedItem = this._listSelectedItemElement(),
                $prevItem,
                $list = this._listElement();
            if ($list.is(":hidden"))
                return;
            if (!$selectedItem.length) {
                this._listItemElement().last().addClass(SELECTED_ITEM_CLASS);
                return
            }
            $selectedItem.removeClass(SELECTED_ITEM_CLASS);
            $prevItem = $selectedItem.prev();
            if ($prevItem.length)
                $prevItem.addClass(SELECTED_ITEM_CLASS)
        },
        _handleTextboxEnterKey: function() {
            var $selectedItem = this._listSelectedItemElement(),
                receivedValue;
            if (!$selectedItem.length) {
                this._popup.hide();
                return
            }
            receivedValue = this._selectedItemDataGetter();
            this._caretPosition = receivedValue.length;
            this.option("value", receivedValue);
            this._popup.hide()
        },
        _handleTextboxCompleteKeys: function() {
            var $list = this._listElement(),
                newValue,
                receivedValue;
            if ($list.is(":hidden"))
                return;
            receivedValue = this._selectedItemDataGetter();
            newValue = receivedValue.length ? receivedValue : this._dataSource().items()[0];
            this._caretPosition = newValue.length;
            newValue = this._displayGetter(newValue);
            this.option("value", newValue);
            this._popup.hide()
        },
        _selectedItemDataGetter: function() {
            var $selectedItem = this._listSelectedItemElement();
            if (!$selectedItem.length)
                return [];
            return this._displayGetter($selectedItem.data(LIST_ITEM_DATA_KEY))
        },
        _handleTextboxEscKey: function() {
            this._popup.hide()
        },
        _renderPopup: function() {
            var $textbox = this._textboxElement(),
                textWidth = $textbox.width(),
                $input = this._textbox._input(),
                vOffset = 0;
            if (DX.devices.current().win8)
                vOffset = -2;
            else if (DX.devices.current().platform === "desktop")
                vOffset = -1;
            this._popup = $("<div/>").addClass(AUTOCOMPLETE_POPUP).appendTo(this._element()).dxPopup({
                shading: false,
                closeOnOutsideClick: true,
                showTitle: false,
                width: textWidth,
                height: "auto",
                position: {
                    my: "left top",
                    at: "left bottom",
                    of: $input,
                    offset: {
                        h: 0,
                        v: vOffset
                    },
                    collision: "flip"
                },
                animation: {
                    show: {
                        type: "slide",
                        duration: 400
                    },
                    hide: {
                        type: "slide",
                        duration: 400
                    }
                }
            }).data("dxPopup");
            this._autocompleteResizeCallback = $.proxy(this._calculatePopupWidth, this);
            utils.windowResizeCallbacks.add(this._autocompleteResizeCallback)
        },
        _calculatePopupWidth: function() {
            var $textbox = this._textboxElement(),
                textWidth = $textbox.width();
            this._popup.option("width", textWidth)
        },
        _renderList: function() {
            this._list = $("<div />").appendTo(this._popup.content()).dxList({
                itemClickAction: $.proxy(this._handleListItemClick, this),
                itemTemplate: this.option("itemTemplate"),
                itemRender: this.option("itemRender"),
                showScrollbar: false,
                scrollingEnabled: false,
                noDataText: "",
                showNextButton: false
            }).data("dxList");
            this._list._templates = this._templates;
            this._setupDataSource()
        },
        _setupDataSource: function() {
            var self = this;
            if (this.option("items").length > 0)
                this._list.option("items", this.option("items"));
            else
                this._list.option("dataSource", this.option("dataSource"));
            this._list._initDataSource()
        },
        _handleListItemClick: function(e) {
            var value = this._displayGetter(e.itemData);
            this._caretPosition = value.length;
            this.option("value", value);
            this._popup.hide()
        },
        _dataSource: function() {
            return this._list._dataSource
        },
        _filterDataSource: function() {
            var searchValue = this._textbox.option("value");
            this._reloadDataSource(searchValue);
            this._clearSearchTimer()
        },
        _reloadDataSource: function(searchValue, searchMethod) {
            var self = this;
            self._dataSource().reload({
                searchField: self.option("displayExpr"),
                searchString: searchValue,
                searchMethod: searchMethod || self.option("filterOperator")
            }).done(function() {
                self._refreshVisibility()
            })
        },
        _refreshVisibility: function() {
            var canFilter = this._textbox.option("value").length >= this.option("minSearchLength"),
                dataSource = this._dataSource(),
                items = dataSource && dataSource.items(),
                hasResults = items.length;
            if (canFilter && hasResults)
                if (items.length === 1 && this._displayGetter(items[0]) === this.option("value"))
                    this._popup.hide();
                else if (this._displayGetter(items[0]).length < this.option("value").length)
                    this._popup.hide();
                else {
                    this._popup._refresh();
                    this._popup.show()
                }
            else
                this._popup.hide()
        },
        _dispose: function() {
            this._clearSearchTimer();
            utils.windowResizeCallbacks.remove(this._autocompleteResizeCallback);
            this.callBase()
        },
        _optionChanged: function(name, value) {
            switch (name) {
                case"value":
                    this._checkExceptions();
                    this._textbox.option(name, value);
                    this._applyFilter();
                    break;
                case"placeholder":
                    this._textbox.option(name, value);
                    break;
                case"items":
                case"dataSource":
                case"itemTemplate":
                case"itemRender":
                    this._list.option(name, value);
                    break;
                case"filterOperator":
                    this._validateFilterOperator();
                    break;
                case"displayExpr":
                    this._compileDisplayGetter();
                    break;
                case"minSearchLength":
                case"searchTimeout":
                    break;
                default:
                    this.callBase.apply(this, arguments)
            }
        },
        _applyFilter: function() {
            var searchValue = this._textbox.option("value"),
                canFilter = searchValue.length >= this.option("minSearchLength");
            if (!canFilter) {
                this._clearSearchTimer();
                this._popup.hide();
                return
            }
            if (this.option("searchTimeout") > 0) {
                if (!this._searchTimer)
                    this._searchTimer = setTimeout($.proxy(this._filterDataSource, this), this.option("searchTimeout"))
            }
            else
                this._filterDataSource()
        },
        _clearSearchTimer: function() {
            clearTimeout(this._searchTimer);
            delete this._searchTimer
        },
        _checkExceptions: function() {
            if (this.option("value") === undefined)
                throw Error("Value option should not be undefined");
        },
        _clean: function() {
            this.callBase();
            this._element().empty()
        }
    }))
})(jQuery, DevExpress);

// Module widgets, file ui.dropDownMenu.js

(function($, DX, undefined) {
    var ui = DX.ui;
    var DROP_DOWN_MENU_CLASS = "dx-dropdownmenu",
        DROP_DOWN_MENU_POPUP_CLASS = DROP_DOWN_MENU_CLASS + "-popup",
        DROP_DOWN_MENU_LIST_CLASS = "dx-dropdownmenu-list",
        DROP_DOWN_MENU_BUTTON_CLASS = "dx-dropdownmenu-button";
    ui.registerComponent("dxDropDownMenu", ui.ContainerWidget.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    items: [],
                    itemClickAction: null,
                    dataSource: null,
                    itemTemplate: "item",
                    itemRender: null,
                    buttonText: "",
                    buttonIcon: null,
                    buttonIconSrc: null,
                    buttonClickAction: null
                })
        },
        _render: function() {
            this._element().addClass(DROP_DOWN_MENU_CLASS);
            this._renderButton();
            this._renderPopup();
            this._renderList();
            this.callBase()
        },
        _renderButton: function() {
            var buttonIconSrc = this.option("buttonIconSrc"),
                buttonIcon = this.option("buttonIcon");
            if (!buttonIconSrc && !buttonIcon)
                buttonIcon = "overflow";
            this._button = this._element().addClass(DROP_DOWN_MENU_BUTTON_CLASS).dxButton({
                text: this.option("buttonText"),
                icon: buttonIcon,
                iconSrc: buttonIconSrc,
                clickAction: this.option("buttonClickAction")
            }).data("dxButton")
        },
        _renderClick: function() {
            this._element().off("." + this.NAME).on(this._eventHelper.eventName("click"), this._createAction(this._handleButtonClick))
        },
        _handleButtonClick: function(e) {
            e.component._popup.show()
        },
        _renderList: function() {
            this._list = this._popup.content().addClass(DROP_DOWN_MENU_LIST_CLASS).dxList({
                scrollingEnabled: false,
                showScrollbar: false,
                noDataText: "",
                itemRender: this.option("itemRender"),
                itemClickAction: this.option("itemClickAction")
            }).data("dxList");
            this._list._templates = this._templates;
            this._list.option("dataSource", this.option("items"));
            this._attachListClick()
        },
        _toggleVisibility: function(visible) {
            this.callBase(visible);
            this._button.option("visible", visible)
        },
        _attachListClick: function() {
            this._list._element().off("." + this.NAME).on(this._eventHelper.eventName("click"), this._createAction(this._handleListClick))
        },
        _handleListClick: function(e) {
            e.component._popup.hide()
        },
        _renderPopup: function() {
            this._popup = $("<div />").addClass(DROP_DOWN_MENU_POPUP_CLASS).appendTo(this._element()).dxPopup({
                showTitle: false,
                shading: false,
                closeOnOutsideClick: true,
                width: "auto",
                height: "auto",
                position: {
                    my: "right top",
                    at: "right bottom",
                    of: this._element(),
                    collision: "fit flip"
                },
                animation: {
                    show: {
                        type: "fade",
                        to: 1
                    },
                    hide: {
                        type: "fade",
                        to: 0
                    }
                }
            }).data("dxPopup")
        },
        _optionChanged: function(name, value) {
            if (/^button/.test(name))
                this._renderButton();
            else if (name === "dataSource" || name === "items")
                this._list.option("dataSource", value);
            else if (name === "itemRender")
                this._list.option("itemRender", value);
            else
                this.callBase.apply(this, arguments)
        }
    }))
})(jQuery, DevExpress);


// Module framework, file framework.js

(function($, DX, undefined) {
    var mergeWithReplace = function(destination, source, needReplaceFn) {
            var result = [];
            for (var i = 0, destinationLength = destination.length; i < destinationLength; i++)
                if (!needReplaceFn(destination[i], source))
                    result.push(destination[i]);
            result.push.apply(result, source);
            return result
        };
    var getMergeCommands = function() {
            return function(destination, source) {
                    return mergeWithReplace(destination, source, function(destObject, source) {
                            return $.grep(source, function(srcObject) {
                                    return destObject.option("id") === srcObject.option("id") && srcObject.option("id") || destObject.option("behavior") === srcObject.option("behavior") && destObject.option("behavior")
                                }).length
                        })
                }
        };
    DX.framework = {utils: {mergeCommands: getMergeCommands()}}
})(jQuery, DevExpress);

// Module framework, file framework.routing.js

(function($, DX) {
    var Class = DX.Class;
    DX.framework.Route = Class.inherit({
        _trimSeparators: function(str) {
            return str.replace(/^[\/.]+|\/+$/g, "")
        },
        _escapeRe: function(str) {
            return str.replace(/\W/g, "\\$1")
        },
        _checkConstraint: function(param, constraint) {
            param = String(param);
            if (typeof constraint === "string")
                constraint = new RegExp(constraint);
            var match = constraint.exec(param);
            if (!match || match[0] !== param)
                return false;
            return true
        },
        _ensureReady: function() {
            var self = this;
            if (this._patternRe)
                return false;
            this._pattern = this._trimSeparators(this._pattern);
            this._patternRe = "";
            this._params = [];
            this._segments = [];
            this._separators = [];
            this._pattern.replace(/[^\/]+/g, function(segment, index) {
                self._segments.push(segment);
                if (index)
                    self._separators.push(self._pattern.substr(index - 1, 1))
            });
            $.each(this._segments, function(index) {
                var isStatic = true,
                    segment = this,
                    separator = index ? self._separators[index - 1] : "";
                if (segment.charAt(0) === ":") {
                    isStatic = false;
                    segment = segment.substr(1);
                    self._params.push(segment);
                    self._patternRe += "(?:" + separator + "([^/]+))";
                    if (segment in self._defaults)
                        self._patternRe += "?"
                }
                else
                    self._patternRe += separator + self._escapeRe(segment)
            });
            this._patternRe = new RegExp("^" + this._patternRe + "$")
        },
        ctor: function(pattern, defaults, constraints) {
            this._pattern = pattern || "";
            this._defaults = defaults || {};
            this._constraints = constraints || {}
        },
        parse: function(uri) {
            var self = this;
            this._ensureReady();
            var matches = this._patternRe.exec(uri);
            if (!matches)
                return false;
            var result = $.extend({}, this._defaults);
            $.each(this._params, function(i) {
                var index = i + 1;
                if (matches.length >= index && matches[index])
                    result[this] = self.parseSegment(matches[index])
            });
            $.each(this._constraints, function(key) {
                if (!self._checkConstraint(result[key], self._constraints[key])) {
                    result = false;
                    return false
                }
            });
            return result
        },
        format: function(routeValues) {
            var self = this;
            this._ensureReady();
            var mergeValues = $.extend({}, this._defaults),
                useStatic = 0,
                ret = [],
                dels = [],
                unusedRouteValues = {};
            $.each(routeValues, function(paramName, paramValue) {
                routeValues[paramName] = self.formatSegment(paramValue);
                if (!(paramName in mergeValues))
                    unusedRouteValues[paramName] = true
            });
            $.each(this._segments, function(index, segment) {
                ret[index] = index ? self._separators[index - 1] : '';
                if (segment.charAt(0) === ':') {
                    var paramName = segment.substr(1);
                    if (!(paramName in routeValues) && !(paramName in self._defaults)) {
                        ret = null;
                        return false
                    }
                    if (paramName in self._constraints && !self._checkConstraint(routeValues[paramName], self._constraints[paramName])) {
                        ret = null;
                        return false
                    }
                    if (paramName in routeValues) {
                        if (routeValues[paramName] !== undefined) {
                            mergeValues[paramName] = routeValues[paramName];
                            ret[index] += routeValues[paramName];
                            useStatic = index
                        }
                        delete unusedRouteValues[paramName]
                    }
                    else if (paramName in mergeValues) {
                        ret[index] += mergeValues[paramName];
                        dels.push(index)
                    }
                }
                else {
                    ret[index] += segment;
                    useStatic = index
                }
            });
            $.each(mergeValues, function(key, value) {
                if (!!value && $.inArray(":" + key, self._segments) === -1 && routeValues[key] !== value) {
                    ret = null;
                    return false
                }
            });
            if (!$.isEmptyObject(unusedRouteValues))
                return false;
            $.each(routeValues, function(i) {
                if (!this in mergeValues) {
                    ret = null;
                    return false
                }
            });
            if (ret === null)
                return false;
            if (dels.length)
                $.map(dels, function(i) {
                    if (i >= useStatic)
                        ret[i] = ''
                });
            var result = ret.join('');
            result = result.replace(/\/+$/, "");
            return result
        },
        formatSegment: function(value) {
            if ($.isArray(value) || $.isPlainObject(value))
                return "json:" + JSON.stringify(value);
            return value
        },
        parseSegment: function(value) {
            if (value.substr(0, 5) === "json:")
                try {
                    value = $.parseJSON(value.substr(5))
                }
                catch(x) {}
            return value
        }
    });
    DX.framework.MvcRouter = DX.Class.inherit({
        ctor: function() {
            this._registry = []
        },
        _trimSeparators: function(str) {
            return str.replace(/^[\/.]+|\/+$/g, "")
        },
        _createRoute: function(pattern, defaults, constraints) {
            return new DX.framework.Route(pattern, defaults, constraints)
        },
        register: function(pattern, defaults, constraints) {
            this._registry.push(this._createRoute(pattern, defaults, constraints))
        },
        parse: function(uri) {
            var ret;
            uri = this._trimSeparators(uri);
            $.each(this._registry, function() {
                var result = this.parse(uri);
                if (result !== false) {
                    ret = result;
                    return false
                }
            });
            return ret ? ret : false
        },
        format: function(obj) {
            var ret;
            obj = obj || {};
            $.each(this._registry, function() {
                var result = this.format(obj);
                if (result !== false) {
                    ret = result;
                    return false
                }
            });
            if (typeof ret === "string")
                return ret;
            return false
        }
    })
})(jQuery, DevExpress);

// Module framework, file framework.command.js

(function($, DX) {
    var ui = DX.ui;
    DX.framework.dxCommand = ui.Component.inherit({
        ctor: function(element, options) {
            if ($.isPlainObject(element)) {
                options = element;
                element = $("<div />")
            }
            this.beforeExecute = $.Callbacks();
            this.afterExecute = $.Callbacks();
            this.callBase(element, options)
        },
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    action: null,
                    id: null,
                    title: "",
                    icon: "",
                    iconSrc: "",
                    location: "",
                    visible: true
                })
        },
        execute: function() {
            var isDisabled = this._options.disabled;
            if ($.isFunction(isDisabled))
                isDisabled = !!isDisabled.apply(this, arguments);
            if (isDisabled)
                throw new Error("Cannot execute command: " + this._options.id);
            this.beforeExecute.fire(arguments);
            this._createActionByOption("action").apply(this, arguments);
            this.afterExecute.fire(arguments)
        },
        _render: function() {
            this.callBase();
            this._element().addClass("dx-command")
        },
        _renderDisabledState: $.noop,
        _dispose: function() {
            this.callBase();
            this.beforeExecute.empty();
            this.afterExecute.empty()
        }
    });
    ui.registerComponent("dxCommand", DX.framework.dxCommand)
})(jQuery, DevExpress);

// Module framework, file framework.viewCache.js

(function($, DX, undefined) {
    var Class = DX.Class;
    DX.framework.ViewCache = Class.inherit({
        ctor: function() {
            this._cache = {}
        },
        setView: function(key, viewInfo) {
            this._cache[key] = viewInfo
        },
        getView: function(key) {
            return this._cache[key]
        },
        removeView: function(key) {
            var result = this._cache[key];
            delete this._cache[key];
            return result
        },
        clear: function() {
            this._cache = {}
        }
    });
    DX.framework.NullViewCache = Class.inherit({
        setView: $.noop,
        getView: $.noop,
        removeView: $.noop,
        clear: $.noop
    })
})(jQuery, DevExpress);

// Module framework, file framework.stateManager.js

(function($, DX, undefined) {
    var Class = DX.Class;
    DX.framework.MemoryKeyValueStorage = Class.inherit({
        ctor: function() {
            this.storage = {}
        },
        getItem: function(key) {
            return this.storage[key]
        },
        setItem: function(key, value) {
            this.storage[key] = value
        },
        removeItem: function(key) {
            delete this.storage[key]
        }
    });
    DX.framework.StateManager = Class.inherit({
        ctor: function(options) {
            options = options || {};
            this.storage = options.storage || new DX.framework.MemoryKeyValueStorage;
            this.stateSources = options.stateSources || []
        },
        addStateSource: function(stateSource) {
            this.stateSources.push(stateSource)
        },
        removeStateSource: function(stateSource) {
            var index = $.inArray(stateSource, this.stateSources);
            if (index > -1) {
                this.stateSources.splice(index, 1);
                stateSource.removeState(this.storage)
            }
        },
        saveState: function() {
            var self = this;
            $.each(this.stateSources, function(index, stateSource) {
                stateSource.saveState(self.storage)
            })
        },
        restoreState: function() {
            var self = this;
            $.each(this.stateSources, function(index, stateSource) {
                stateSource.restoreState(self.storage)
            })
        },
        clearState: function() {
            var self = this;
            $.each(this.stateSources, function(index, stateSource) {
                stateSource.removeState(self.storage)
            })
        }
    })
})(jQuery, DevExpress);

// Module framework, file framework.browserAdapters.js

(function($, DX, undefined) {
    var Class = DX.Class;
    var ROOT_PAGE_URL = "__root__";
    DX.framework.DefaultBrowserAdapter = Class.inherit({
        ctor: function(options) {
            options = options || {};
            this._window = options.window || window;
            this.popState = $.Callbacks();
            $(this._window).on("hashchange", $.proxy(this._onHashChange, this))
        },
        replaceState: function(uri) {
            uri = this._normalizeUri(uri);
            this._window.history.replaceState(null, null, "#" + uri)
        },
        pushState: function(uri) {
            uri = this._normalizeUri(uri);
            this._window.history.pushState(null, null, "#" + uri)
        },
        createRootPage: function() {
            this._window.history.replaceState(null, null, "#" + ROOT_PAGE_URL)
        },
        _onHashChange: function() {
            this.popState.fire()
        },
        getWindowName: function() {
            return this._window.name
        },
        setWindowName: function(windowName) {
            this._window.name = windowName
        },
        back: function() {
            this._window.history.back()
        },
        getHash: function() {
            return this._normalizeUri(this._window.location.hash)
        },
        isRootPage: function() {
            return this.getHash() === ROOT_PAGE_URL
        },
        _normalizeUri: function(uri) {
            return (uri || "").replace(/^#+/, "")
        }
    });
    DX.framework.OldBrowserAdapter = DX.framework.DefaultBrowserAdapter.inherit({
        ctor: function() {
            this._innerEventCount = 0;
            this.callBase.apply(this, arguments)
        },
        replaceState: function(uri) {
            uri = this._normalizeUri(uri);
            if (this.getHash() !== uri) {
                this._skipNextEvent();
                this.back();
                this._skipNextEvent();
                this._window.location.hash = uri
            }
        },
        pushState: function(uri) {
            uri = this._normalizeUri(uri);
            if (this.getHash() !== uri) {
                this._skipNextEvent();
                this._window.location.hash = uri
            }
        },
        createRootPage: function() {
            this.pushState(ROOT_PAGE_URL)
        },
        _onHashChange: function() {
            if (this._innerEventCount)
                this._innerEventCount--;
            else
                this.popState.fire()
        },
        _skipNextEvent: function() {
            this._innerEventCount++
        }
    });
    DX.framework.InFrameBrowserAdapter = DX.framework.OldBrowserAdapter.inherit({
        ctor: function() {
            var self = this;
            this.callBase.apply(this, arguments);
            this._window.history.back = function() {
                self._window.location.hash = ROOT_PAGE_URL
            }
        },
        back: function() {
            if (!this.isRootPage())
                this._window.history.back()
        }
    });
    DX.framework.HistorylessBrowserAdapter = DX.framework.DefaultBrowserAdapter.inherit({
        ctor: function(options) {
            this.callBase(options);
            this._currentHash = this._window.location.hash
        },
        replaceState: function(uri) {
            this._currentHash = this._normalizeUri(uri)
        },
        pushState: function(uri) {
            this._currentHash = this._normalizeUri(uri)
        },
        createRootPage: function() {
            this.pushState(ROOT_PAGE_URL)
        },
        _onHashChange: function() {
            return
        },
        getHash: function() {
            return this._normalizeUri(this._currentHash)
        },
        back: function() {
            this.replaceState(ROOT_PAGE_URL)
        }
    })
})(jQuery, DevExpress);

// Module framework, file framework.browserNavigationDevice.js

(function($, DX, undefined) {
    var Class = DX.Class;
    var WINDOW_NAME = "dxApplication";
    DX.framework.BrowserNavigationDevice = Class.inherit({
        ctor: function(options) {
            options = options || {};
            this._browserAdapter = this._createBrowserAdapter(options);
            this.uriChanged = $.Callbacks();
            this.backInitiated = $.Callbacks();
            this._deferredNavigate = null;
            this._browserAdapter.popState.add($.proxy(this._onPopState, this));
            if (this._browserAdapter.getWindowName() !== WINDOW_NAME)
                this._prepareBrowserHistory();
            if (this._browserAdapter.isRootPage())
                this._browserAdapter.pushState("")
        },
        _createBrowserAdapter: function(options) {
            var sourceWindow = options.window || window;
            var notSupportBrowserHistory = window.top["dx-not-support-browser-history"];
            if (notSupportBrowserHistory)
                return new DX.framework.HistorylessBrowserAdapter(options);
            if (sourceWindow === sourceWindow.top)
                if (sourceWindow.history.replaceState && sourceWindow.history.pushState)
                    return new DX.framework.DefaultBrowserAdapter(options);
                else
                    return new DX.framework.OldBrowserAdapter(options);
            else
                return new DX.framework.InFrameBrowserAdapter(options)
        },
        _prepareBrowserHistory: function() {
            var hash = this.getUri();
            this._browserAdapter.setWindowName(WINDOW_NAME);
            this._browserAdapter.createRootPage();
            this._browserAdapter.pushState(hash)
        },
        getUri: function() {
            return this._browserAdapter.getHash()
        },
        setUri: function(uri) {
            if (this._browserAdapter.isRootPage())
                this._browserAdapter.pushState(uri);
            else
                this._browserAdapter.replaceState(uri)
        },
        _onPopState: function(uri) {
            var self = this,
                currentHash = this.getUri();
            if (this._deferredNavigate && this._deferredNavigate.state() === "pending")
                if (this._browserAdapter.isRootPage())
                    this._deferredNavigate.resolve();
                else
                    this._browserAdapter.back();
            else if (this._browserAdapter.isRootPage())
                this.backInitiated.fire();
            else {
                this._deferredNavigate = $.Deferred().done(function() {
                    self.uriChanged.fire(currentHash)
                });
                this._browserAdapter.back()
            }
        },
        back: function() {
            this._browserAdapter.back()
        }
    })
})(jQuery, DevExpress);

// Module framework, file framework.navigationManager.js

(function($, DX, undefined) {
    var Class = DX.Class;
    var NAVIGATION_TARGETS = {
            current: "current",
            blank: "blank",
            back: "back"
        },
        STORAGE_HISTORY_KEY = "__history";
    DX.framework.NavigationStack = Class.inherit({
        ctor: function(options) {
            options = options || {};
            this.itemsRemoved = $.Callbacks();
            this.clear()
        },
        currentItem: function() {
            return this.items[this.currentIndex]
        },
        back: function() {
            this.currentIndex--;
            if (this.currentIndex < 0)
                throw Error("Unable to go back");
        },
        forward: function() {
            this.currentIndex++;
            if (this.currentIndex >= this.items.length)
                throw Error("Unable to go forward");
        },
        navigate: function(uri, replaceCurrent) {
            if (this.currentIndex < this.items.length && this.currentIndex > -1 && this.items[this.currentIndex].uri === uri)
                return;
            if (replaceCurrent)
                this.currentIndex--;
            else if (this.currentIndex > 1 && this.items[this.currentIndex - 1].uri === uri) {
                this.back();
                return
            }
            if (this.currentIndex + 1 < this.items.length && this.items[this.currentIndex + 1].uri === uri)
                this.currentIndex++;
            else {
                var toDelete = this.items.splice(this.currentIndex + 1, this.items.length - this.currentIndex - 1);
                var newItem = {uri: uri};
                this.items.push(newItem);
                newItem.key = this.items[0].uri + "_" + (this.items.length - 1) + "_" + uri;
                this.currentIndex++;
                this._deleteItems(toDelete)
            }
            return newItem
        },
        _deleteItems: function(items) {
            if (items)
                this.itemsRemoved.fire(items)
        },
        getPreviousItem: function() {
            return this.items.length > 1 ? this.items[this.currentIndex - 1] : undefined
        },
        canBack: function() {
            return this.currentIndex > 0
        },
        clear: function() {
            this._deleteItems(this.items);
            this.items = [];
            this.currentIndex = -1
        }
    });
    DX.framework.NavigationManager = Class.inherit({
        ctor: function(options) {
            options = options || {};
            var self = this;
            self.navigationStacks = {};
            self.currentStack = new DX.framework.NavigationStack;
            self.currentUri = undefined;
            self.navigating = $.Callbacks();
            self.navigated = $.Callbacks();
            self.itemRemoved = $.Callbacks();
            self._navigationDevice = options.navigationDevice || new DX.framework.BrowserNavigationDevice;
            self._navigationDevice.uriChanged.add($.proxy(self.navigate, self));
            self._navigationDevice.backInitiated.add($.proxy(self.back, self));
            self._stateStorageKey = options.stateStorageKey || STORAGE_HISTORY_KEY
        },
        navigate: function(uri, options) {
            var self = this;
            options = $.extend({target: NAVIGATION_TARGETS.blank}, options || {});
            if (uri === undefined)
                uri = self._navigationDevice.getUri();
            if (/^_back$/.test(uri)) {
                self.back();
                return
            }
            var args = {
                    currentUri: self.currentUri,
                    uri: uri,
                    options: options
                };
            self.navigating.fire(args);
            if (args.cancel)
                self._navigationDevice.setUri(self.currentUri);
            else {
                uri = args.uri;
                if (self.currentUri !== uri)
                    DX.utils.executeAsync(function() {
                        var previousUri = self.currentUri;
                        self.currentUri = uri;
                        self._navigationDevice.setUri(uri);
                        self._updateHistory(uri, options);
                        self.navigated.fire({
                            uri: uri,
                            previousUri: previousUri,
                            options: options,
                            item: self.currentItem()
                        })
                    })
            }
        },
        _createNavigationStack: function() {
            var result = new DX.framework.NavigationStack;
            result.itemsRemoved.add($.proxy(this._removeItems, this));
            return result
        },
        _updateHistory: function(uri, options) {
            var isRoot = options.root || !!this.navigationStacks[uri] && options.target === NAVIGATION_TARGETS.blank,
                direction = "none",
                prevItemDirection = (this.currentItem() || {}).direction;
            if (isRoot || !this.currentStack.items.length) {
                this.navigationStacks[uri] = this.navigationStacks[uri] || this._createNavigationStack();
                this.currentStack = this.navigationStacks[uri]
            }
            if (isRoot && this.currentStack.items.length)
                this.currentStack.currentIndex = 0;
            else {
                var prevIndex = this.currentStack.currentIndex;
                switch (options.target) {
                    case NAVIGATION_TARGETS.blank:
                        this.currentStack.navigate(uri);
                        break;
                    case NAVIGATION_TARGETS.current:
                        this.currentStack.navigate(uri, true);
                        break;
                    case NAVIGATION_TARGETS.back:
                        this.currentStack.back();
                        break;
                    default:
                        throw Error("Unknown navigation target: '" + target + "'. Use the DevExpress.framework.NavigationManager.NAVIGATION_TARGETS enumerable values.");
                }
                var indexDelta = this.currentStack.currentIndex - prevIndex;
                if (indexDelta < 0 && prevItemDirection !== "none")
                    direction = "backward";
                else if (indexDelta > 0 && this.currentStack.currentIndex > 0)
                    direction = "forward"
            }
            options.direction = options.direction || direction;
            if (options.target === NAVIGATION_TARGETS.current)
                this.currentItem().direction = prevItemDirection;
            else if (options.target === NAVIGATION_TARGETS.blank)
                this.currentItem().direction = options.direction
        },
        _removeItems: function(items) {
            var self = this;
            $.each(items, function(index, item) {
                self.itemRemoved.fire(item)
            })
        },
        back: function(alternate) {
            if (DX.backButtonCallback.fire())
                return;
            var item = this.getPreviousItem();
            if (item)
                this.navigate(item.uri, {
                    target: NAVIGATION_TARGETS.back,
                    item: item
                });
            else if (alternate)
                this.navigate(alternate);
            else
                this._navigationDevice.back()
        },
        getPreviousItem: function() {
            return this.currentStack.getPreviousItem()
        },
        currentItem: function() {
            return this.currentStack.currentItem()
        },
        currentIndex: function() {
            return this.currentStack.currentIndex
        },
        canBack: function() {
            return this.currentStack.canBack()
        },
        getItemByIndex: function(index) {
            return this.currentStack.items[index]
        },
        saveState: function(storage) {
            if (this.currentStack.items.length) {
                var state = {
                        items: this.currentStack.items,
                        currentIndex: this.currentStack.currentIndex,
                        currentStackKey: this.currentStack.items[0].uri
                    };
                var json = JSON.stringify(state);
                storage.setItem(this._stateStorageKey, json)
            }
            else
                this.removeState(storage)
        },
        restoreState: function(storage) {
            var json = storage.getItem(this._stateStorageKey);
            if (json)
                try {
                    var state = JSON.parse(json),
                        stack = this._createNavigationStack();
                    if (!state.items[0].uri)
                        throw Error("Error while application state restoring. State has been cleared. Refresh the page.");
                    stack.items = state.items;
                    stack.currentIndex = state.currentIndex;
                    this.navigationStacks[stack.items[0].uri] = stack;
                    this.currentStack = this.navigationStacks[state.currentStackKey];
                    this._navigationDevice.setUri(this.currentItem().uri)
                }
                catch(e) {
                    this.removeState(storage);
                    throw e;
                }
        },
        removeState: function(storage) {
            storage.removeItem(this._stateStorageKey)
        },
        clearHistory: function() {
            this.currentStack.clear()
        }
    });
    DX.framework.NavigationManager.NAVIGATION_TARGETS = NAVIGATION_TARGETS
})(jQuery, DevExpress);

// Module framework, file framework.actionExecutors.js

(function($, DX, undefined) {
    DX.framework.createActionExecutors = function(app) {
        return {
                routing: {execute: function(e) {
                        if ($.isPlainObject(e.action)) {
                            var toBack = e.action.backBehaviour;
                            if (e.action.backBehaviour)
                                delete e.action.backBehaviour;
                            var routeValues = e.action,
                                uri = app.router.format(routeValues);
                            if (toBack)
                                app.back(uri);
                            else
                                app.navigate(uri);
                            e.handled = true
                        }
                    }},
                hash: {execute: function(e) {
                        if (typeof e.action !== "string" || e.action.charAt(0) !== "#")
                            return;
                        var uriTemplate = e.action.substr(1),
                            args = e.args[0],
                            uri = uriTemplate;
                        var defaultEvaluate = function(expr) {
                                var getter = DX.data.utils.compileGetter(expr),
                                    model = e.args[0].model;
                                return getter(model)
                            };
                        var evaluate = args.evaluate || defaultEvaluate;
                        uri = uriTemplate.replace(/\{([^}]+)\}/g, function(entry, expr) {
                            expr = $.trim(expr);
                            if (expr.indexOf(",") > -1)
                                expr = $.map(expr.split(","), $.trim);
                            var value = evaluate(expr);
                            value = DX.framework.Route.prototype.formatSegment(value);
                            return value !== undefined ? value : entry
                        });
                        var navigateOptions = (e.component || {}).NAME === "dxCommand" ? e.component.option() : {};
                        app.navigate(uri, navigateOptions);
                        e.handled = true
                    }}
            }
    }
})(jQuery, DevExpress);

// Module framework, file framework.application.js

(function($, DX) {
    var Class = DX.Class,
        BACK_COMMAND_TITLE = "Back",
        frameworkNS = DX.framework;
    DX.framework.Application = Class.inherit({
        ctor: function(options) {
            options = options || {};
            this.namespace = options.namespace || options.ns || window;
            this.components = [];
            this.router = options.router || new DX.framework.MvcRouter;
            this.navigationManager = options.navigationManager || new DX.framework.NavigationManager;
            this.navigationManager.navigating.add($.proxy(this._onNavigating, this));
            this.navigationManager.navigated.add($.proxy(this._onNavigated, this));
            this.navigationManager.itemRemoved.add($.proxy(this._onNavigationItemRemoved, this));
            this.stateManager = options.stateManager || new DX.framework.StateManager({storage: options.stateStorage || sessionStorage});
            this.stateManager.addStateSource(this.navigationManager);
            this._viewCache = options.disableViewCache ? new DX.framework.NullViewCache : new DX.framework.ViewCache;
            this.navigation = this._createNavigationCommands(options.navigation);
            this.beforeViewSetup = $.Callbacks();
            this.afterViewSetup = $.Callbacks();
            this.viewShowing = $.Callbacks();
            this.viewShown = $.Callbacks();
            this.viewDisposing = $.Callbacks();
            this.viewDisposed = $.Callbacks();
            DX.registerActionExecutor(DX.framework.createActionExecutors(this));
            DX.overlayTargetContainer(".dx-viewport .dx-layout");
            this.components.push(this.router);
            this.components.push(this.navigationManager)
        },
        _createNavigationCommands: function(commandConfig) {
            if (!commandConfig)
                return [];
            return $.map(commandConfig, function(item) {
                    var command;
                    if (item instanceof frameworkNS.dxCommand)
                        command = item;
                    else
                        command = new frameworkNS.dxCommand($.extend({
                            location: "navigation",
                            root: true
                        }, item));
                    return command
                })
        },
        _callComponentMethod: function(methodName, args) {
            var tasks = [];
            $.each(this.components, function(index, component) {
                if (component[methodName]) {
                    var result = component[methodName](args);
                    if (result && result.done)
                        tasks.push(result)
                }
            });
            return $.when.apply($, tasks)
        },
        init: function() {
            return this._callComponentMethod("init")
        },
        _onNavigating: function(args) {
            var self = this;
            if (!args.cancel) {
                var routeData = this.router.parse(args.uri);
                var uri = this.router.format(routeData);
                if (args.uri !== uri && uri) {
                    args.cancel = true;
                    this.navigate(uri, args.options)
                }
            }
        },
        _onNavigated: function(args) {
            var viewInfo = this._acquireView(args.item);
            this._setCurrentView(viewInfo, args.options.direction)
        },
        _onViewRemoved: function(viewInfo) {
            var args = {viewInfo: viewInfo};
            this._processEvent("viewDisposing", args, args.viewInfo.model);
            this._disposeView(args.viewInfo);
            this._processEvent("viewDisposed", args, args.viewInfo.model)
        },
        _onNavigationItemRemoved: function(item) {
            var viewInfo = this._viewCache.removeView(item.key);
            if (viewInfo)
                this._onViewRemoved(viewInfo)
        },
        _disposeView: function(viewInfo){},
        _acquireView: function(navigationItem) {
            var viewInfo = this._viewCache.getView(navigationItem.key);
            if (!viewInfo) {
                viewInfo = this._createView(navigationItem.uri);
                this._viewCache.setView(navigationItem.key, viewInfo)
            }
            return viewInfo
        },
        _processEvent: function(eventName, args, model) {
            this._callComponentMethod(eventName, args);
            if (this[eventName] && this[eventName].fire)
                this[eventName].fire(args);
            var modelMethod = (model || {})[eventName];
            if (modelMethod)
                modelMethod.call(model, args)
        },
        _createView: function(uri) {
            var routeData = this.router.parse(uri);
            var viewInfo = {
                    viewName: routeData.view,
                    uri: uri
                };
            this._processEvent("beforeViewSetup", {
                routeData: routeData,
                viewInfo: viewInfo
            });
            viewInfo.model = viewInfo.model || this._createModel(routeData);
            this._processEvent("afterViewSetup", viewInfo);
            if (this.navigationManager.canBack())
                this._appendBackCommand(viewInfo);
            return viewInfo
        },
        _createModel: function(routeData) {
            var setupFunc = $.noop;
            if (routeData.view in this.namespace)
                setupFunc = this.namespace[routeData.view];
            return setupFunc.call(this.namespace, routeData) || {}
        },
        _appendBackCommand: function(viewInfo) {
            var commands = viewInfo.model.commands = viewInfo.model.commands || [];
            var toMergeTo = [new DX.framework.dxCommand({
                        id: "back",
                        title: BACK_COMMAND_TITLE,
                        location: "back",
                        behavior: "back",
                        action: "#_back",
                        icon: "arrowleft",
                        type: "back"
                    })];
            var result = DX.framework.utils.mergeCommands(toMergeTo, commands);
            commands.length = 0;
            commands.push.apply(commands, result)
        },
        _setCurrentView: function(viewInfo, direction) {
            var self = this;
            var eventArgs = {
                    viewInfo: viewInfo,
                    direction: direction
                };
            self._processEvent("viewShowing", eventArgs, viewInfo.model);
            if (eventArgs.cancel)
                return;
            DX.data.utils.DataSourceLoadLock.obtain();
            return self._setCurrentViewAsyncImpl(eventArgs.viewInfo, direction).done(function() {
                    DX.data.utils.DataSourceLoadLock.release();
                    self._processEvent("viewShown", eventArgs, viewInfo.model)
                })
        },
        _highlightCurrentNavigationCommand: function(viewInfo) {
            var self = this;
            if ('currentNavigationItemId' in viewInfo.model)
                $.each(this.navigation, function(index, command) {
                    command.option("highlighted", viewInfo.model.currentNavigationItemId === command.option("id"))
                });
            else {
                var currentUri = "#" + viewInfo.uri;
                var selectedCommand = $.grep(this.navigation, function(command, index) {
                        var commandUri = command.option("action");
                        return typeof commandUri === 'string' && /^#/.test(commandUri) && commandUri === currentUri
                    })[0];
                if (!selectedCommand) {
                    var parsedUri = self.router.parse(viewInfo.uri);
                    selectedCommand = $.grep(this.navigation, function(command, index) {
                        return self._selectNavigationItemByUri(command, parsedUri)
                    })[0]
                }
                $.each(this.navigation, function(index, command) {
                    command.option("highlighted", command === selectedCommand)
                })
            }
        },
        _selectNavigationItemByUri: function(command, parsedUri) {
            var commandUri = command.option("action");
            if (typeof commandUri === 'string') {
                var commandUri = this.router.parse(commandUri.replace(/^#+/, ""));
                return parsedUri.view === commandUri.view
            }
            else
                return false
        },
        _setCurrentViewAsyncImpl: DX.abstract,
        navigate: function(uri, options) {
            var self = this;
            if (!self._inited)
                self.init().done(function() {
                    self._inited = true;
                    self.restoreState();
                    self.navigate(uri, options)
                });
            else
                self.navigationManager.navigate(uri, options)
        },
        canBack: function() {
            return this.navigationManager.canBack()
        },
        back: function() {
            this.navigationManager.back()
        },
        saveState: function() {
            this.stateManager.saveState()
        },
        restoreState: function() {
            this.stateManager.restoreState()
        },
        clearState: function() {
            this.stateManager.clearState()
        }
    })
})(jQuery, DevExpress);

// Module framework, file framework.html.js

(function($, DX, undefined) {
    var hiddenBagId = "__hidden-bag";
    var processIDs = function($markup, process) {
            var elementsWithIds = $markup.find("[id]");
            $.each(elementsWithIds, function(index, element) {
                var $el = $(element),
                    id = $el.attr("id");
                $el.attr("id", process(id))
            })
        };
    var patchIDs = function($markup) {
            processIDs($markup, function(id) {
                var result = id;
                if (id.indexOf(hiddenBagId) === -1)
                    result = hiddenBagId + "-" + id;
                return result
            })
        };
    var unpatchIDs = function($markup) {
            processIDs($markup, function(id) {
                var result = id;
                if (id.indexOf(hiddenBagId) === 0)
                    result = id.substr(hiddenBagId.length + 1);
                return result
            })
        };
    var removeFromViewPort = function($items) {
            patchIDs($items);
            $items.appendTo($("#" + hiddenBagId))
        };
    var restoreToViewPort = function($items, $viewPort) {
            unpatchIDs($items);
            $items.appendTo($viewPort)
        };
    DX.framework.html = {
        layoutControllers: {},
        utils: {
            removeFromViewPort: removeFromViewPort,
            restoreToViewPort: restoreToViewPort
        }
    };
    $(function() {
        $("<div id=\"" + hiddenBagId + "\"></div>").appendTo($(document.body)).hide()
    })
})(jQuery, DevExpress);

// Module framework, file framework.widgetCommandAdapters.js

(function($, DX) {
    var adapters = DX.framework.html.commandToDXWidgetAdapters = {
            _updateItems: [],
            addCommandBase: function(widget, command, containerOptions, initialItemOptions, customizeItem) {
                var itemOptions = $.extend(initialItemOptions, command.option());
                var items = widget.option("items");
                items.push(itemOptions);
                var updateItem = function(name, newValue, oldValue) {
                        $.extend(itemOptions, command.option());
                        customizeItem(itemOptions, name, newValue, oldValue);
                        if (name !== "highlighted")
                            widget.option("items", items)
                    };
                this._updateItems.push(updateItem);
                updateItem();
                command.optionChanged.add(updateItem);
                widget.disposing.add(function() {
                    command.optionChanged.remove(updateItem)
                })
            }
        };
    adapters.dxToolbar = {addCommand: function($container, command, containerOptions) {
            var toolbar = $container.data("dxToolbar");
            var isMenu = containerOptions.menu || containerOptions.name === "menu";
            function customizeOption(itemOptions) {
                var options = {
                        text: resolveTextValue(command, containerOptions),
                        clickAction: function() {
                            command.execute()
                        },
                        disabled: command.option("disabled"),
                        icon: resolveIconValue(command, containerOptions, "icon"),
                        iconSrc: resolveIconValue(command, containerOptions, "iconSrc"),
                        type: resolveTypeValue(command, containerOptions)
                    };
                var align = containerOptions.align || undefined;
                itemOptions.options = options;
                itemOptions.align = align
            }
            if (isMenu) {
                var dropdown = $.grep(toolbar.option("items"), function(item, index) {
                        return item.widget && item.widget === 'dropDownMenu'
                    })[0];
                if (!dropdown) {
                    var itemRender = function(itemData, itemIndex, itemElement) {
                            $(itemElement).text(itemData.command.option("title"))
                        };
                    dropdown = $.extend({
                        widget: 'dropDownMenu',
                        options: {
                            items: [],
                            itemRender: itemRender,
                            itemTemplate: containerOptions.itemTemplate,
                            itemClickAction: function(e) {
                                e.itemData.command.execute()
                            }
                        }
                    }, containerOptions);
                    var items = toolbar.option("items");
                    items.push(dropdown);
                    toolbar.option("items", items)
                }
                var menuItem = $.extend({command: command}, command.option());
                dropdown.options.items.push(menuItem);
                command.optionChanged.add(function() {
                    $.extend(menuItem, command.option());
                    toolbar._refresh()
                })
            }
            else
                adapters.addCommandBase(toolbar, command, containerOptions, {widget: "button"}, customizeOption);
            toolbar.option("visible", true)
        }};
    adapters.dxActionSheet = {addCommand: function($container, command, containerOptions) {
            var actionSheet = $container.data("dxActionSheet"),
                initialItemData = {command: command};
            adapters.addCommandBase(actionSheet, command, containerOptions, initialItemData, function(itemOptions) {
                itemOptions.text = resolveTextValue(command, containerOptions);
                itemOptions.icon = resolveIconValue(command, containerOptions, "icon");
                itemOptions.iconSrc = resolveIconValue(command, containerOptions, "iconSrc")
            })
        }};
    adapters.dxList = {addCommand: function($container, command, containerOptions) {
            var list = $container.data("dxList");
            adapters.addCommandBase(list, command, containerOptions, {}, function(itemOptions) {
                itemOptions.title = resolveTextValue(command, containerOptions);
                itemOptions.clickAction = function() {
                    if (!itemOptions.disabled)
                        command.execute()
                };
                itemOptions.icon = resolveIconValue(command, containerOptions, "icon");
                itemOptions.iconSrc = resolveIconValue(command, containerOptions, "iconSrc")
            })
        }};
    adapters.dxNavBar = {addCommand: function($container, command, containerOptions) {
            var navbar = $container.data("dxNavBar");
            var initialItemData = {command: command};
            navbar.option("itemClickAction", function(e) {
                e.itemData.command.execute()
            });
            var updateSelectedIndex = function() {
                    var items = navbar.option("items");
                    for (var i = 0, itemsCount = items.length; i < itemsCount; i++)
                        if (items[i].highlighted) {
                            navbar.option("selectedIndex", i);
                            break
                        }
                };
            adapters.addCommandBase(navbar, command, containerOptions, initialItemData, function(itemOptions, name, newValue, oldValue) {
                if (name === "highlighted") {
                    if (newValue)
                        updateSelectedIndex()
                }
                else {
                    itemOptions.text = resolveTextValue(command, containerOptions);
                    itemOptions.icon = resolveIconValue(command, containerOptions, "icon");
                    itemOptions.iconSrc = resolveIconValue(command, containerOptions, "iconSrc");
                    updateSelectedIndex()
                }
            })
        }};
    var resolvePropertyValue = function(command, containerOptions, propertyName) {
            var defaultOption = containerOptions.defaultCommandOptions ? containerOptions.defaultCommandOptions[propertyName] : undefined;
            return command.option(propertyName) || defaultOption
        };
    var resolveTextValue = function(command, containerOptions) {
            var hasIcon = !!command.option("icon") || command.option("iconSrc"),
                titleValue = resolvePropertyValue(command, containerOptions, "title");
            return containerOptions.showText || !hasIcon ? titleValue : ""
        };
    var resolveIconValue = function(command, containerOptions, propertyName) {
            var hasText = !!command.option("title"),
                iconValue = resolvePropertyValue(command, containerOptions, propertyName);
            return containerOptions.showIcon || !hasText ? iconValue : undefined
        };
    var resolveTypeValue = function(command, containerOptions) {
            return resolvePropertyValue(command, containerOptions, "type")
        }
})(jQuery, DevExpress);

// Module framework, file framework.commandManager.js

(function($, DX, undefined) {
    var Class = DX.Class,
        ui = DevExpress.ui;
    DX.framework.dxCommandContainer = ui.Component.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    locations: [],
                    defaultOptions: {
                        showText: true,
                        showIcon: true
                    }
                })
        },
        _render: function() {
            this.callBase();
            this._element().addClass("dx-command-container")
        },
        arrangeCommands: function(commands, attachCommandToContainerImpl) {
            var self = this;
            var locations = [];
            $.each(self.option("locations"), function(index, locationOptions) {
                var filteredcommands = $.grep(commands, function(command) {
                        return command && command.option("location") === locationOptions.name && !locationOptions.processed
                    });
                if (filteredcommands.length > 0) {
                    locations.push($.extend({commands: filteredcommands}, self.option("defaultOptions"), locationOptions));
                    locationOptions.processed = true
                }
            });
            attachCommandToContainerImpl(self._element(), locations)
        }
    });
    ui.registerComponent("dxCommandContainer", DX.framework.dxCommandContainer);
    DX.framework.html.CommandManager = Class.inherit({
        ctor: function(options) {
            options = options || {};
            this.globalCommands = options.globalCommands || [];
            this.commandsToWidgetRegistry = [this._commandsToDXWidget]
        },
        _commandsToDXWidget: function($container, locations) {
            var componentNames = $container.data("dxComponents");
            var adapters = DX.framework.html.commandToDXWidgetAdapters;
            if (componentNames)
                for (var index in componentNames) {
                    var widgetName = componentNames[index];
                    if (widgetName in adapters) {
                        var widget = $container.data(widgetName);
                        widget.beginUpdate();
                        $.each(locations, function(index, location) {
                            $.each(location.commands, function(index, command) {
                                adapters[widgetName].addCommand($container, command, location)
                            })
                        });
                        widget.endUpdate();
                        return true
                    }
                }
            return false
        },
        _findCommands: function($view) {
            var result = $.map($view.children(".dx-command"), function(element) {
                    return $(element).data("dxCommand")
                });
            return result
        },
        _findCommandContainers: function($markup) {
            var result = $.map($markup.find(".dx-command-container"), function(element) {
                    return $(element).data("dxCommandContainer")
                });
            return result
        },
        _arrangeCommandsToContainers: function(commands, containers) {
            var self = this;
            $.each(containers, function(index, container) {
                container.arrangeCommands(commands, $.proxy(self._attachCommandsToContainer, self))
            })
        },
        _attachCommandsToContainer: function(commands, $container, options) {
            var handled = false;
            $.each(this.commandsToWidgetRegistry, function(index, commandsToWidget) {
                handled = commandsToWidget(commands, $container, options);
                return !handled
            });
            if (!handled)
                this._defaultCommandsToContainer(commands, $container, options)
        },
        _defaultCommandsToContainer: function($container, locations) {
            $.each(locations, function(index, location) {
                $.each(location.commands, function(index, command) {
                    var $source = command._element();
                    if ($source) {
                        $container.append($source);
                        $source.on("click", function() {
                            command.execute()
                        })
                    }
                })
            })
        },
        layoutCommands: function($markup, extraCommands) {
            extraCommands = extraCommands || [];
            var markupCommands = this._findCommands($markup);
            var viewRelatedCommands = DX.framework.utils.mergeCommands(extraCommands, markupCommands);
            var allCommands = DX.framework.utils.mergeCommands(this.globalCommands, viewRelatedCommands);
            var commandContainers = this._findCommandContainers($markup);
            this._arrangeCommandsToContainers(allCommands, commandContainers)
        }
    })
})(jQuery, DevExpress);

// Module framework, file framework.layoutController.js

(function($, DX, undefined) {
    var Class = DX.Class;
    var PLACEHOLDERS_SELECTOR = ".dx-content-placeholder:not(.dx-content-placeholder .dx-content-placeholder)";
    var placeholderSelector = function(placeholderId) {
            return ".dx-content-placeholder-" + placeholderId
        };
    DX.framework.html.DefaultLayoutController = Class.inherit({
        ctor: function(options) {
            if (options)
                this.init(options)
        },
        init: function(options) {
            this._navigationManager = options.navigationManager;
            this.$viewPort = options.$viewPort;
            this._prevViewInfo = {}
        },
        activate: function(){},
        deactivate: function(){},
        showView: function(viewInfo, direction) {
            return this._showViewImpl(viewInfo, direction)
        },
        _onRenderComplete: function(viewInfo){},
        _showViewImpl: function(viewInfo, direction) {
            var self = this,
                $markup = viewInfo.renderResult.$markup,
                deferred = $.Deferred();
            viewInfo.renderResult.renderComplete.add(function() {
                self._onRenderComplete(viewInfo)
            });
            if (viewInfo.layoutName === self._prevViewInfo.layoutName) {
                var transitions = $.map(self.$viewPort.find(PLACEHOLDERS_SELECTOR), function(placeholderElement) {
                        var $placeholder = $(placeholderElement),
                            placeholder = $placeholder.data("dxContentPlaceholder"),
                            transitionType = self._disableTransitions ? "none" : placeholder.option("transition");
                        return {
                                destination: $placeholder,
                                source: $markup.find(placeholderSelector(placeholder.option("name"))),
                                type: transitionType || "none",
                                direction: direction || "none"
                            }
                    });
                setTimeout(function() {
                    self._executeTransitions(transitions).done(function() {
                        self._changeView(viewInfo);
                        deferred.resolve()
                    })
                })
            }
            else {
                self._changeView(viewInfo);
                deferred.resolve()
            }
            self._prevViewInfo = viewInfo;
            return deferred.promise()
        },
        _changeView: function(viewInfo) {
            var $markup = viewInfo.renderResult.$markup;
            DX.framework.html.utils.removeFromViewPort(this.$viewPort.children());
            DX.framework.html.utils.restoreToViewPort($markup, this.$viewPort);
            $markup.show()
        },
        _executeTransitions: function(transitions) {
            var self = this;
            var animatedTransitions = $.map(transitions, function(transitionOptions) {
                    return transitionOptions.type !== "none" ? DX.framework.html.TransitionExecutor.create(self.$viewPort, transitionOptions) : null
                });
            var animatedDeferreds = $.map(animatedTransitions, function(transition) {
                    return transition.exec()
                });
            var result = $.when.apply($, animatedDeferreds).done(function() {
                    $.each(animatedTransitions, function(index, transition) {
                        transition.finalize()
                    })
                });
            return result
        },
        _executeTransition: function(options) {
            return transitionsExecutor.exec(options)
        }
    });
    $(function() {
        DX.framework.html.layoutControllers['default'] = new DX.framework.html.DefaultLayoutController
    })
})(jQuery, DevExpress);

// Module framework, file framework.templateEngine.js

(function($, DX, undefined) {
    var Class = DX.Class;
    DX.framework.html.KnockoutJSTemplateEngine = Class.inherit({
        ctor: function(options) {
            this.navigationManager = options.navigationManager
        },
        applyTemplate: function(template, model) {
            ko.applyBindings(model, $(template).get(0))
        }
    })
})(jQuery, DevExpress);

// Module framework, file framework.viewEngine.js

(function($, DX, undefined) {
    var isEqual = function(a, b) {
            for (var p in a)
                switch (typeof a[p]) {
                    case'object':
                        if (!isEqual(a[p], b[p]))
                            return false;
                        break;
                    default:
                        if (a[p] != b[p])
                            return false
                }
            for (var p in b)
                if (!a || typeof a[p] == 'undefined')
                    return false;
            return true
        };
    var Class = DX.Class;
    var ui = DX.ui;
    var _VIEW_ROLE = "dxView",
        _LAYOUT_ROLE = "dxLayout";
    DX.framework[_VIEW_ROLE] = ui.Component.inherit({_defaultOptions: function() {
            return $.extend(this.callBase(), {
                    name: null,
                    title: null,
                    layout: null
                })
        }});
    ui.registerComponent(_VIEW_ROLE, DX.framework.dxView);
    DX.framework[_LAYOUT_ROLE] = ui.Component.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    name: null,
                    controller: "default"
                })
        },
        _render: function() {
            this.callBase();
            this._element().addClass("dx-layout")
        }
    });
    ui.registerComponent(_LAYOUT_ROLE, DX.framework.dxLayout);
    DX.framework.dxViewPlaceholder = ui.Component.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {viewName: null})
        },
        _render: function() {
            this.callBase();
            this._element().addClass("dx-view-placeholder")
        }
    });
    ui.registerComponent("dxViewPlaceholder", DX.framework.dxViewPlaceholder);
    DX.framework.dxContentPlaceholder = ui.Component.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {
                    name: null,
                    transition: undefined
                })
        },
        _render: function() {
            this.callBase();
            this._element().addClass("dx-content-placeholder").addClass("dx-content-placeholder-" + this.option("name"))
        }
    });
    ui.registerComponent("dxContentPlaceholder", DX.framework.dxContentPlaceholder);
    DX.framework.dxContent = ui.Component.inherit({
        _defaultOptions: function() {
            return $.extend(this.callBase(), {targetPlaceholder: null})
        },
        _render: function() {
            this.callBase();
            this._element().addClass("dx-content")
        }
    });
    ui.registerComponent("dxContent", DX.framework.dxContent);
    DX.framework.html.ViewEngine = Class.inherit({
        ctor: function(options) {
            options = options || {};
            this.$root = options.$root;
            this.device = options.device || {};
            this.templateEngine = options.templateEngine;
            this.commandManager = options.commandManager;
            this.dataOptionsAttributeName = options.dataOptionsAttributeName || "data-options";
            this._defaultLayout = options.defaultLayout;
            this._templateMap = {};
            this._pendingViewContainer = null;
            this.viewSelecting = $.Callbacks();
            this.layoutSelecting = $.Callbacks();
            this.modelFromViewDataExtended = $.Callbacks();
            this.layoutApplying = $.Callbacks();
            this.layoutApplied = $.Callbacks()
        },
        init: function() {
            this._initDefaultLayout();
            return this._loadTemplates()
        },
        _initDefaultLayout: function() {
            this._$defaultLayout = $("<div class=\"layout\" data-options=\"dxLayout : { name: 'default', controller: 'default' } \"> \
                <div class=\"content\" data-options=\"dxContentPlaceholder : { name: 'content', transition: 'none' } \" ></div> \
            </div>")
        },
        _getDefaultLayout: function() {
            var $result = this._$defaultLayout.clone();
            this._createComponents($result);
            return $result
        },
        _findTemplate: function(name, role) {
            var self = this,
                $template;
            var $templates = $.grep(this._templateMap[name] || [], function($item) {
                    return $item.data(role)
                });
            if (!$templates.length)
                throw new Error("Error 404: Template not found. role:  " + role + ", name: " + name);
            var fitCount = -1;
            $.each($templates, function(index, $tmpl) {
                var templateFitCount = 0;
                var options = $tmpl.data(role).option();
                $.each(self.device, function(paramName) {
                    var value = options[paramName];
                    if (value === self.device[paramName])
                        templateFitCount++
                });
                if (templateFitCount > fitCount) {
                    fitCount = templateFitCount;
                    $template = $tmpl
                }
            });
            var $result = $template.clone(true, true);
            this._createComponents($result);
            return $result
        },
        findViewTemplate: function(viewName) {
            var findViewEventArgs = {viewName: viewName};
            this.viewSelecting.fire(findViewEventArgs);
            return findViewEventArgs.view ? $(findViewEventArgs.view) : this._findTemplate(viewName, _VIEW_ROLE)
        },
        findLayoutTemplate: function(layoutName) {
            var findLayoutEventArgs = {layoutName: layoutName};
            this.layoutSelecting.fire(findLayoutEventArgs);
            return findLayoutEventArgs.layout ? $(findLayoutEventArgs.layout) : this._findTemplate(layoutName, _LAYOUT_ROLE)
        },
        _extendModelFromViewData: function($view, model) {
            DX.utils.extendFromObject(model, $view.data(_VIEW_ROLE).option());
            this.modelFromViewDataExtended.fire({
                view: $view,
                model: model
            })
        },
        _createComponents: function($markup, types) {
            var self = this;
            var result = [];
            $markup.find("*").addBack().filter("[" + self.dataOptionsAttributeName + "]").each(function(index, element) {
                var $element = $(element),
                    optionsString = $element.attr(self.dataOptionsAttributeName),
                    options;
                try {
                    options = new Function("return {" + optionsString + "}")()
                }
                catch(ex) {
                    throw new Error("Unable to parse options.\nMessage: " + ex + ";\nOptions value: " + optionsString);
                }
                for (var componentName in options)
                    if (!types || $.inArray(componentName, types) > -1)
                        if ($element[componentName]) {
                            $element[componentName](options[componentName]);
                            result.push($element.data(componentName))
                        }
            });
            return result
        },
        _loadTemplatesFromMarkup: function($markup) {
            if ($markup.find("[data-dx-role]").length)
                throw Error("View templates should be updated according to the 13.1 changes. See the ... for more details.");
            var self = this,
                components = self._createComponents($markup, [_VIEW_ROLE, _LAYOUT_ROLE]);
            $.each(components, function(index, component) {
                var $element = component._element(),
                    role = component.NAME,
                    options = component.option(),
                    templateName = options.name,
                    list = self._templateMap[templateName] || [];
                $.each(list, function(index, $item) {
                    var itemComponent = $item.data(role);
                    if (itemComponent && isEqual(options, itemComponent.option()))
                        throw new Error("Several markup templates with the same parameters are found.\r\nDetails: " + $element.attr("data-options"));
                });
                list.push($element);
                self._templateMap[templateName] = list;
                $element.detach()
            })
        },
        _applyLayout: function($view, $layout) {
            var layoutApplyingEventArgs = {
                    $view: $view,
                    $layout: $layout
                };
            this.layoutApplying.fire(layoutApplyingEventArgs);
            var $markup = layoutApplyingEventArgs.$markup ? $(layoutApplyingEventArgs.$markup) : this._applyLayoutCore($view, $layout);
            this.layoutApplied.fire({$markup: $markup});
            return $markup
        },
        _applyLayoutCore: function($view, $layout) {
            if ($view.children(".dx-content").length === 0)
                this._wrapViewDefaultContent($view);
            var $toMerge = $().add($layout).add($view);
            var $placeholderContents = $toMerge.find(".dx-content");
            $.each($placeholderContents, function() {
                var $placeholderContent = $(this);
                var placeholderId = $placeholderContent.data("dxContent").option("targetPlaceholder");
                var $placeholder = $toMerge.find(".dx-content-placeholder-" + placeholderId);
                $placeholder.empty();
                $placeholder.append($placeholderContent)
            });
            $view.children().hide().appendTo($layout);
            return $layout
        },
        _applyPartialViews: function($render) {
            var self = this;
            $.each($render.find(".dx-view-placeholder"), function() {
                var $partialPlaceholder = $(this);
                var viewName = $partialPlaceholder.data("dxViewPlaceholder").option("viewName");
                var $view = self._findTemplate(viewName, _VIEW_ROLE);
                self._applyPartialViews($view);
                $partialPlaceholder.append($view);
                $view.show()
            })
        },
        _ajaxImpl: function() {
            return $.ajax.apply($, arguments)
        },
        _loadTemplates: function() {
            var self = this;
            this._templateMap = {};
            this._loadTemplatesFromMarkup(this.$root.children());
            var tasks = [];
            var winPhonePrefix;
            if (location.protocol.indexOf("wmapp") >= 0)
                winPhonePrefix = location.protocol + "www/";
            $("head").find("link[rel='dx-template']").each(function(index, link) {
                var url = $(link).attr("href");
                var task = self._ajaxImpl({
                        url: (winPhonePrefix || "") + url,
                        isLocal: winPhonePrefix ? true : undefined,
                        success: function(data) {
                            self._loadTemplatesFromMarkup(DX.utils.createMarkupFromString(data))
                        },
                        dataType: "html"
                    });
                tasks.push(task)
            });
            return $.when.apply($, tasks)
        },
        afterViewSetup: function(viewInfo) {
            this._ensureViewTemplate(viewInfo);
            this._extendModelFormViewTemplate(viewInfo.$viewTemplate, viewInfo.model)
        },
        _extendModelFormViewTemplate: function($viewTemplate, model) {
            this._extendModelFromViewData($viewTemplate, model)
        },
        _ensureTemplates: function(viewInfo) {
            this._ensureViewTemplate(viewInfo);
            this._ensureLayoutTemplate(viewInfo)
        },
        _ensureViewTemplate: function(viewInfo) {
            viewInfo.$viewTemplate = viewInfo.$viewTemplate || this.findViewTemplate(viewInfo.viewName);
            return viewInfo.$viewTemplate
        },
        _wrapViewDefaultContent: function($viewTemplate) {
            $viewTemplate.wrapInner("<div></div>");
            $viewTemplate.children().eq(0).dxContent({targetPlaceholder: 'content'})
        },
        _ensureLayoutTemplate: function(viewInfo) {
            if (!viewInfo.$layoutTemplate) {
                var $viewTemplate = viewInfo.$viewTemplate;
                var layoutName = $viewTemplate.data(_VIEW_ROLE).option("layout") || this._defaultLayout,
                    $layoutTemplate;
                viewInfo.layoutName = layoutName;
                if (layoutName)
                    $layoutTemplate = this.findLayoutTemplate(layoutName);
                else {
                    $layoutTemplate = this._getDefaultLayout();
                    this._wrapViewDefaultContent($viewTemplate);
                    this._createComponents($viewTemplate)
                }
                viewInfo.$layoutTemplate = $layoutTemplate
            }
        },
        renderBlankView: function(viewInfo, $renderTarget) {
            this._ensureTemplates(viewInfo);
            var $markup = viewInfo.$layoutTemplate;
            $markup.appendTo($renderTarget);
            this._applyPartialViews($markup);
            this.templateEngine.applyTemplate($markup, viewInfo.model);
            this.commandManager.layoutCommands($markup);
            viewInfo.renderResult = {
                $markup: $markup,
                layoutControllerName: $markup.data(_LAYOUT_ROLE).option("controller"),
                renderComplete: $.Callbacks()
            }
        },
        renderCompleteView: function(viewInfo) {
            if (viewInfo.renderResult.rendered)
                return;
            viewInfo.renderResult.rendered = true;
            var model = viewInfo.model || {};
            var $viewTemplate = viewInfo.$viewTemplate;
            var $markup = viewInfo.renderResult.$markup;
            this._applyPartialViews($viewTemplate);
            this._applyLayout($viewTemplate, $markup);
            this.templateEngine.applyTemplate($markup, model);
            this.commandManager.layoutCommands($markup, model.commands);
            viewInfo.renderResult.renderComplete.fire()
        }
    })
})(jQuery, DevExpress);

// Module framework, file framework.htmlApplication.js

(function($, DX, undefined) {
    var frameworkNS = DX.framework,
        htmlNS = frameworkNS.html;
    htmlNS.HtmlApplication = frameworkNS.Application.inherit({
        ctor: function(options) {
            options = options || {};
            this.callBase(options);
            this._initViewPort(options.viewPort);
            this.device = options.device || DX.devices.current();
            this._$root = $(options.rootNode || document.body);
            this._$viewPort = $(".dx-viewport");
            if (!this._$viewPort.length)
                this._$viewPort = $("<div class='dx-viewport'></div>").appendTo(document.body);
            this.viewEngine = options.viewEngine || new htmlNS.ViewEngine({
                $root: this._$root,
                device: this.device,
                defaultLayout: options.defaultLayout,
                templateEngine: options.templateEngine || new htmlNS.KnockoutJSTemplateEngine({navigationManager: this.navigationManager}),
                commandManager: options.commandManager || new htmlNS.CommandManager({globalCommands: this.navigation})
            });
            this.components.push(this.viewEngine);
            this.viewRendered = $.Callbacks();
            this._initLayoutControllers();
            this._$viewPort.addClass(this._getThemeClasses(DX.devices.current()))
        },
        _disposeView: function(viewInfo) {
            if (viewInfo.renderResult) {
                viewInfo.renderResult.$markup.remove();
                delete viewInfo.renderResult
            }
            this.callBase(viewInfo)
        },
        viewPort: function() {
            return this._$viewPort
        },
        _initViewPort: function(options) {
            options = options || {};
            if (DX.devices.current().platform === "desktop")
                options = $.extend({disabled: true}, options);
            if (!options.disabled)
                DX.ui.initViewport(options)
        },
        _getThemeClasses: function(device) {
            var platformToThemeMap = {
                    ios: "dx-theme-ios dx-theme-ios-typography",
                    android: "dx-theme-android dx-theme-android-typography",
                    desktop: "dx-theme-desktop dx-theme-desktop-typography",
                    win8: "dx-theme-win8 dx-theme-win8-typography",
                    win8phone: "dx-theme-win8 dx-theme-win8-typography"
                };
            var key = device.platform;
            if (device.platform === "win8" && device.phone)
                return platformToThemeMap[key] + " dx-theme-win8phone dx-theme-win8phone-typography";
            return platformToThemeMap[key]
        },
        _initLayoutControllers: function() {
            var self = this;
            $.each(htmlNS.layoutControllers, function(index, controller) {
                if (controller.init)
                    controller.init({
                        app: self,
                        $viewPort: self._$viewPort,
                        navigationManager: self.navigationManager
                    })
            })
        },
        _afterCreateViewModel: function(viewInfo) {
            this.callBase(viewInfo);
            if (this.viewEngine.afterCreateViewModel)
                this.viewEngine.afterCreateViewModel(viewInfo)
        },
        _setCurrentViewAsyncImpl: function(viewInfo, direction) {
            var self = this;
            var result = $.Deferred();
            DX.enqueueAsync(function() {
                self._ensureBlankViewRendered(viewInfo);
                self._highlightCurrentNavigationCommand(viewInfo)
            }).done(function() {
                self._showRenderedView(viewInfo, direction).done(function() {
                    DX.enqueueAsync(function() {
                        self._ensureViewRendered(viewInfo);
                        result.resolve()
                    })
                })
            });
            return result
        },
        _showRenderedView: function(viewInfo, direction) {
            var self = this;
            var layoutControllerName = viewInfo.renderResult.layoutControllerName || "empty";
            var layoutController = htmlNS.layoutControllers[layoutControllerName];
            if (layoutController === undefined)
                throw Error("The '" + layoutControllerName + "' layout controller not found. But the view being shown supposes to use it. Make sure you have a corresponding *.js reference in your app.html");
            var deferred = new $.Deferred;
            DX.enqueue(function() {
                if (self._activeLayoutController !== layoutController) {
                    if (self._activeLayoutController)
                        self._activeLayoutController.deactivate();
                    layoutController.activate();
                    self._activeLayoutController = layoutController
                }
                return layoutController.showView(viewInfo, direction).done(function() {
                        deferred.resolve()
                    })
            });
            return deferred.promise()
        },
        _ensureBlankViewRendered: function(viewInfo) {
            if (!viewInfo.renderResult) {
                this.viewEngine.renderBlankView(viewInfo, this._$viewPort);
                this._processEvent("blankViewRendered", viewInfo);
                var modelBlankViewRendered = viewInfo.model.blankViewRendered;
                if (modelBlankViewRendered)
                    modelBlankViewRendered.call(viewInfo.model, viewInfo)
            }
        },
        _ensureViewRendered: function(viewInfo) {
            if (!viewInfo.renderResult.rendered) {
                this.viewEngine.renderCompleteView(viewInfo, this._$viewPort);
                this._processEvent("viewRendered", viewInfo);
                var modelViewRendered = viewInfo.model.viewRendered;
                if (modelViewRendered)
                    modelViewRendered.call(viewInfo.model, viewInfo)
            }
        }
    })
})(jQuery, DevExpress);

// Module framework, file framework.transitionExecutor.js

(function($, DX) {
    var TRANSITION_DURATION = 400;
    var TransitionExecutor = DX.Class.inherit({
            ctor: function(container, options) {
                this.container = container;
                this.options = options
            },
            exec: function() {
                var self = this,
                    options = self.options;
                var $source = options.source,
                    $destination = options.destination;
                var wrapperProps = self._createWrapperProps($destination);
                var $sourceWrapper = self._wrapElementContent($source, wrapperProps),
                    $destinationWrapper = self._wrapElementContent($destination, wrapperProps);
                var sourceDomLocation = self._getElementDomLocation($sourceWrapper);
                $sourceWrapper.insertAfter($destinationWrapper);
                this._finalize = function() {
                    self._restoreElementDomLocation($sourceWrapper, sourceDomLocation);
                    self._unwrapElement($destination);
                    self._unwrapElement($source)
                };
                return self._animate($.extend({}, options, {
                        source: $sourceWrapper,
                        destination: $destinationWrapper
                    }))
            },
            finalize: function() {
                if (!this._finalize)
                    throw Error("The 'exec' method should be called before the 'finalize' one.");
                this._finalize()
            },
            _createWrapperProps: function($element) {
                return {
                        top: 0,
                        left: $element.css("left"),
                        width: $element.outerWidth(true),
                        height: $element.outerHeight(true)
                    }
            },
            _wrapElementContent: function($element, wrapperProps) {
                var $relativeWrapper = $("<div class='dx-transition-outer-wrapper'/>").css(wrapperProps);
                $element.wrapInner($relativeWrapper);
                $relativeWrapper = $element.children().eq(0);
                var $absoluteWrapper = $("<div class='dx-transition-inner-wrapper'/>").css(wrapperProps);
                $relativeWrapper.wrapInner($absoluteWrapper);
                return $relativeWrapper.children().eq(0)
            },
            _unwrapElement: function($element) {
                var $relativeWrapper = $element.children().eq(0);
                var $absoluteWrapper = $relativeWrapper.children().eq(0);
                $absoluteWrapper.children().eq(0).unwrap().unwrap()
            },
            _getElementDomLocation: function($element) {
                return {$parent: $element.parent()}
            },
            _restoreElementDomLocation: function($element, location) {
                var $parent = location.$parent;
                $parent.append($element)
            },
            _animate: function() {
                return (new $.Deferred).resolve().promise()
            }
        });
    var SlideTransitionExecutor = TransitionExecutor.inherit({_animate: function(options) {
                if (options.direction === "none")
                    return $.Deferred().resolve().promise();
                var $source = options.source,
                    $destination = options.destination;
                var containerWidth = this.container.width(),
                    destinationLeft = $destination.position().left;
                if (options.direction === "backward")
                    containerWidth = -containerWidth;
                var promiseSource = DX.fx.animate($source, {
                        type: "slide",
                        from: {left: containerWidth + destinationLeft},
                        to: {left: destinationLeft},
                        duration: TRANSITION_DURATION
                    });
                var promiseDestination = DX.fx.animate($destination, {
                        type: "slide",
                        from: {left: destinationLeft},
                        to: {left: destinationLeft - containerWidth},
                        duration: TRANSITION_DURATION
                    });
                return $.when(promiseSource, promiseDestination)
            }});
    var OverflowTransitionExecutor = TransitionExecutor.inherit({_animate: function(options) {
                var $source = options.source,
                    $destination = options.destination,
                    destinationTop = $destination.position().top,
                    destinationLeft = $destination.position().left,
                    containerWidth = this.container.width();
                if (options.direction === "backward")
                    containerWidth = -containerWidth;
                var animations = [];
                if (options.direction === "forward")
                    animations.push(DX.fx.animate($source, {
                        type: "slide",
                        from: {
                            top: destinationTop,
                            left: containerWidth + destinationLeft
                        },
                        to: {left: destinationLeft},
                        duration: TRANSITION_DURATION
                    }));
                else {
                    animations.push(DX.fx.animate($source, {
                        type: "slide",
                        from: {
                            left: destinationLeft,
                            "z-index": 1
                        },
                        to: {left: destinationLeft},
                        duration: TRANSITION_DURATION
                    }));
                    animations.push(DX.fx.animate($destination, {
                        type: "slide",
                        from: {"z-index": 2},
                        to: {left: destinationLeft - containerWidth},
                        duration: TRANSITION_DURATION
                    }))
                }
                return $.when.apply($, animations)
            }});
    var FadeTransitionExecutor = TransitionExecutor.inherit({_animate: function(options) {
                var $source = options.source,
                    $destination = options.destination,
                    d = new $.Deferred;
                $source.css({opacity: 0});
                $destination.animate({opacity: 0}, TRANSITION_DURATION);
                $source.animate({opacity: 1}, TRANSITION_DURATION, function() {
                    d.resolve()
                });
                return d.promise()
            }});
    TransitionExecutor.create = function(container, options) {
        switch (options.type) {
            case"slide":
                return new SlideTransitionExecutor(container, options);
            case"fade":
                return new FadeTransitionExecutor(container, options);
            case"overflow":
                return new OverflowTransitionExecutor(container, options);
            default:
                throw Error("Unknown transition type \"" + options.type + "\"");
        }
    };
    DX.framework.html.TransitionExecutor = TransitionExecutor
})(jQuery, DevExpress);


