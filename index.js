var fs = require('fs');
var path = require('path');
var url = require('url');
var util = require('util');
var assign = require('object-assign');
var clearRequire = require('clear-require');
var Velocity = require('velocity/lib/engine');

module.exports = function(options) {
  options = assign({
    encoding: 'utf-8',
    extension: '.vm',
    templates: '.',
    mockData: '.',
    root: '.',
    macro: '.',
    rewriteRules: {}
  }, options);
  return function(req, res, next) {
    var urlObject = url.parse(req.url);
    var pathname = options.rewriteRules[urlObject.pathname] || urlObject.pathname;
    var templateAbsPath = path.resolve(path.join(options.templates, pathname));
    var dataAbsPath = path.resolve(path.join(options.mockData, pathname.replace(options.extension, '.js')));
    if (fs.existsSync(templateAbsPath)) {
      var tpl = fs.readFileSync(templateAbsPath, {encoding: options.encoding});
      var context = {};
      if (fs.existsSync(dataAbsPath)) {
        try {
          var contextExport = require(dataAbsPath);
          if (util.isFunction(contextExport)) {
            context = contextExport(req, res);
          } else {
            context = contextExport;
          }
        }
        catch (e) {
          console.log('File "' + dataAbsPath + ' require failed.\n' + e);
        }
      }
      var compiledTpl = new Velocity({
        root: path.resolve(options.root),
        template: templateAbsPath,
        macro: path.resolve(options.macro)
      });
      var output = compiledTpl.render(context);
      res.end(output);
    } else {
      next();
    }
  };
};
