(function() {
  var App, Body, Clock, File, Mail, Options,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  App = (function() {
    App.prototype.template = YANTRE.templates.app;

    App.prototype.$el = $('#apps');

    App.prototype.max_elements = 6;

    App.prototype.toggle_class = 'grayscale';

    function App(options) {
      var _this = this;
      this.options = options != null ? options : window.options;
      this._generate_html = __bind(this._generate_html, this);
      this.gray_scale = this.options.get(this.options.APP_GRAYSCALE);
      if (this.gray_scale) {
        this.$el.addClass(this.toggle_class);
      }
      this.options.registerOnChange(this.options.APP_GRAYSCALE, function(new_value, old_value) {
        return _this.$el.toggleClass(_this.toggle_class, new_value);
      });
    }

    App.prototype.render = function() {
      return chrome.management.getAll(this._generate_html);
    };

    App.prototype._generate_html = function(all_apps) {
      var $append, counter,
        _this = this;
      $append = $('<ul></ul>');
      counter = 0;
      $.each(all_apps.sort(this._compareByName), function(index, app) {
        if (app.isApp) {
          if (counter === 0) {
            $append.append('<li></li>');
          }
          $append.find('li:last-of-type').append(_this.template({
            app_link: app.appLaunchUrl,
            id: app.id,
            name: app.name,
            icon_link: app.icons[app.icons.length - 1].url
          }));
          if (_this.max_elements - counter === 1) {
            return counter = 0;
          } else {
            return counter++;
          }
        }
      });
      this.$el.append($append);
      return this.$el.children('ul').bxSlider({
        pager: false,
        infiniteLoop: false,
        hideControlOnEnd: true,
        nextText: '<i class="icon-right"></>',
        prevText: '<i class="icon-left"></>'
      });
    };

    App.prototype._compareByName = function(app1, app2) {
      var a, b;
      a = app1.name.toLowerCase();
      b = app2.name.toLowerCase();
      if (a > b) {
        return 1;
      } else if (a === b) {
        return 0;
      } else {
        return -1;
      }
    };

    return App;

  })();

  Body = (function() {
    Body.prototype.$el = $('body');

    Body.prototype.toggle_class = 'dark';

    function Body(options) {
      var _this = this;
      this.options = options != null ? options : window.options;
      this.dark = this.options.get(this.options.DARK_FONT);
      if (this.dark) {
        this.$el.addClass(this.toggle_class);
      }
      this.options.registerOnChange(this.options.DARK_FONT, function(new_value, old_value) {
        return _this.$el.toggleClass(_this.toggle_class, new_value);
      });
    }

    return Body;

  })();

  Clock = (function() {
    Clock.prototype.options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    };

    Clock.prototype.locale = "en-US";

    function Clock() {
      this.date = new Date().toLocaleDateString(this.locale, this.options);
    }

    Clock.prototype.render = function() {
      $('#clock > div').FlipClock({
        clockFace: 'TwentyFourHourClock'
      });
      return $('#clock > h1').text(this.date);
    };

    return Clock;

  })();

  File = (function() {
    function File() {}

    File.prototype.filesystem = window.requestFileSystem || window.webkitRequestFileSystem;

    File.prototype.contructor = function(options) {
      if (options == null) {
        options = window.options;
      }
      return window.requestFileSystem(window.PERSISTENT, 5 * 1024 * 1024, this._init_file_system, this._error_handler);
    };

    File.prototype._init_file_system = function(fs) {
      return this.fs = fs;
    };

    File.prototype._error_handler = function(error) {
      var message;
      message = 'An error occured:';
      switch (error.code) {
        case FileError.NOT_FOUND_ERR:
          message = "" + message + " File or directory not found";
          break;
        case FileError.NOT_READABLE_ERR:
          message = "" + message + " File or directory not readable";
          break;
        case FileError.PATH_EXISTS_ERR:
          message = "" + message + " File or directory already exists";
          break;
        case FileError.TYPE_MISMATCH_ERR:
          message = "" + message + " Invalid filetype";
          break;
        default:
          message = "" + message + " Unknown Error";
      }
      return console.log(message);
    };

    return File;

  })();

  Mail = (function() {
    function Mail() {
      this._error = __bind(this._error, this);
      this._success = __bind(this._success, this);
      this._generate_html = __bind(this._generate_html, this);
    }

    Mail.prototype.mail_template = YANTRE.templates.mail;

    Mail.prototype.read_template = YANTRE.templates.read;

    Mail.prototype.unread_template = YANTRE.templates.unread;

    Mail.prototype.url = 'https://mail.google.com/mail/feed/atom/';

    Mail.prototype.$el = $('#mails');

    Mail.prototype.render = function() {
      return $.get(this.url).done(this._success).fail(this._error);
    };

    Mail.prototype._generate_html = function($res) {
      var append_html, self;
      append_html = '';
      self = this;
      $res.find('entry').each(function(index) {
        var $author, $entry;
        $entry = $(this);
        $author = $entry.find('author');
        return append_html += self.mail_template({
          title: $entry.find('title').text(),
          author: "" + ($author.children('name').text()) + " (" + ($author.children('email').text()) + ")",
          time: $entry.find('issued').text(),
          link: $entry.find('link').attr('href'),
          summary: $entry.find('summary').text()
        });
      });
      return append_html;
    };

    Mail.prototype._showUnread = function($res) {
      var mails_html, test, unread_html;
      mails_html = this._generate_html($res);
      unread_html = this.unread_template({
        count: Number($res.find('fullcount').text()),
        account: $res.find('title').first().text().split('for ')[1]
      });
      test = $(unread_html);
      this.$el.append(unread_html);
      return this.$el.find('ul').append(mails_html);
    };

    Mail.prototype._showRead = function() {
      return this.$el.append(this.read_template());
    };

    Mail.prototype._success = function(data) {
      var $res;
      $res = $(data);
      if (Number($(data).find('fullcount').text()) > 0) {
        return this._showUnread($res);
      } else {
        return this._showRead();
      }
    };

    Mail.prototype._error = function(data) {
      return console.error('failed', data);
    };

    return Mail;

  })();

  $(function() {
    var errorHandler, initFS, options;
    options = new Options(function() {
      var app, body, clock, mail;
      window.options = options;
      app = new App();
      mail = new Mail();
      clock = new Clock();
      body = new Body();
      app.render();
      mail.render();
      return clock.render();
    });
    $("#default_home").click(function() {
      chrome.tabs.update({
        url: "chrome-internal://newtab/"
      });
      return false;
    });
    $("#file-input").on("change", function(e) {
      var thefiles;
      thefiles = e.target.files;
      console.log('files', thefiles);
      return $.each(thefiles, function(i, item) {
        var reader, thefile;
        thefile = item;
        console.log(thefile.webkitRelativePath);
        reader = new FileReader();
        reader.onload = function() {
          return console.log("FILES: ", thefile.name);
        };
        return reader.readAsArrayBuffer(thefile);
      });
    });
    initFS = function(fs) {
      console.log('file system init', fs);
      return fs.root.getDirectory('/', {}, function(dirEntry) {
        var dirReader;
        console.log('dirEntry', dirEntry);
        dirReader = dirEntry.createReader();
        return dirReader.readEntries(function(entries) {
          return console.log('entries', entries);
        }, errorHandler);
      }, errorHandler);
    };
    errorHandler = function(error) {
      return console.log('An error occured', error);
    };
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    return window.requestFileSystem(window.TEMPORARY, 5 * 1024 * 1024, initFS, errorHandler);
  });

  Options = (function() {
    Options.prototype.template = YANTRE.templates.option;

    Options.prototype.namespace = 'YANTRE.storage';

    Options.prototype.storage = chrome.storage.sync;

    Options.prototype.options = {};

    Options.prototype.$el = $('#options');

    Options.prototype.listener = {};

    Options.prototype.DARK_FONT = 'darkFontColor';

    Options.prototype.APP_GRAYSCALE = 'appGrayscale';

    function Options(done) {
      this._triggerListener = __bind(this._triggerListener, this);
      var _this = this;
      this.storage.get(null, function(options) {
        var key, value;
        for (key in options) {
          value = options[key];
          if (key.slice(0, +(_this.namespace.length - 1) + 1 || 9e9) === _this.namespace) {
            _this.options[key] = value;
          }
        }
        _this._registerBtnClick();
        _this._registerInputChange();
        chrome.storage.onChanged.addListener(_this._triggerListener);
        return done();
      });
    }

    Options.prototype.get = function(key) {
      return this.options[this._getFullKey(key)];
    };

    Options.prototype.set = function(key, value, done) {
      var data;
      if (done == null) {
        done = function() {};
      }
      data = {};
      data[this._getFullKey(key)] = value;
      return this.storage.set(data, done);
    };

    Options.prototype.registerOnChange = function(key, cb) {
      key = this._getFullKey(key);
      if (this.listener[key] === void 0) {
        this.listener[key] = [];
      }
      return this.listener[key].push(cb);
    };

    Options.prototype.render = function() {
      return this.$el.html(this.template({
        darkFont: {
          name: this.DARK_FONT,
          value: Boolean(this.get(this.DARK_FONT))
        },
        grayApps: {
          name: this.APP_GRAYSCALE,
          value: Boolean(this.get(this.APP_GRAYSCALE))
        }
      }));
    };

    Options.prototype._registerBtnClick = function() {
      var css_class,
        _this = this;
      css_class = 'show';
      this.$el.on('mousedown', function(e) {
        return e.stopPropagation();
      });
      return $('#options_btn').on('click', function() {
        _this.render();
        $(document).one('mousedown', function(e) {
          var id;
          id = $(e.target).attr('id');
          if (id !== 'options_btn') {
            return _this.$el.removeClass(css_class);
          }
        });
        return _this.$el.toggleClass(css_class);
      });
    };

    Options.prototype._registerInputChange = function() {
      var _this = this;
      return this.$el.on('change', 'input', function(e) {
        return _this.set(e.target.name, e.target.checked, function() {
          var $target;
          $target = $(e.target).parent();
          $target.addClass('saved');
          return setTimeout((function() {
            return $target.removeClass('saved');
          }), 5000);
        });
      });
    };

    Options.prototype._getFullKey = function(key) {
      return "" + this.namespace + "." + key;
    };

    Options.prototype._triggerListener = function(changes, namespace) {
      var key, listener, value, _results;
      _results = [];
      for (key in changes) {
        value = changes[key];
        if (this.$el.hasClass("show")) {
          this.$el.find("input#" + (key.split('.')[2])).prop('checked', value.newValue);
        }
        this.options[key] = value.newValue;
        if (this.listener[key]) {
          _results.push((function() {
            var _i, _len, _ref, _results1;
            _ref = this.listener[key];
            _results1 = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              listener = _ref[_i];
              _results1.push(listener(value.newValue, value.oldValue));
            }
            return _results1;
          }).call(this));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    return Options;

  })();

}).call(this);
