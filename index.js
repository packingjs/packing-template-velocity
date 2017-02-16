var fs = require('fs');
var path = require('path');
var url = require('url');
var util = require('util');
var assign = require('object-assign-deep');
var clearRequire = require('clear-require');
var Velocity = require('velocity/lib/engine');

module.exports = function(options) {
  options = assign({
    encoding: 'utf-8',
    extension: '.vm',
    templates: '.',
    mockData: '.',
    globalData: '__global.js',
    root: '.',
    macro: '.',
    rewriteRules: {}
  }, options);
  return function(req, res, next) {
    var urlObject = url.parse(req.url);
    var pathname = options.rewriteRules[urlObject.pathname] || urlObject.pathname;
    var templateAbsPath = path.resolve(path.join(options.templates, pathname));
    var dataAbsPath = path.resolve(path.join(options.mockData, pathname.replace(options.extension, '.js')));
    var globalDataPath = path.resolve(path.join(options.mockData, options.globalData));
    if (fs.existsSync(templateAbsPath)) {
      var tpl = fs.readFileSync(templateAbsPath, {encoding: options.encoding});
      if (fs.existsSync(templateAbsPath)) {
        var globalContext = {};
        if (fs.existsSync(globalDataPath)) {
          var gcontext = require(globalDataPath);
          if (util.isFunction(gcontext)) {
            globalContext = gcontext(req, res);
          } else {
            globalContext = gcontext;
          }
        }
        var pageContext = {};
        if (fs.existsSync(dataAbsPath)) {
          var pcontext = require(dataAbsPath);
          if (util.isFunction(pcontext)) {
            pageContext = pcontext(req, res);
          } else {
            pageContext = pcontext;
          }
        }
        var compiledTpl = new Velocity({
          root: path.resolve(options.root),
          template: templateAbsPath,
          macro: path.resolve(options.macro)
        });
        try {
          var output = compiledTpl.render(assign(globalContext, pageContext));
          res.end(output);
        } catch (e) {
          console.log(e);
          next();
        }
      } else {
        next();
      }
    };
  };
};
