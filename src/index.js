import { existsSync } from 'fs';
import assign from 'object-assign-deep';
import Velocity from 'velocity/lib/engine';
import { getPath, getContext } from 'packing-template-util';

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
  return async (req, res, next) => {
    const { templatePath, pageDataPath, globalDataPath } = getPath(req, options);
    if (existsSync(templatePath)) {
      const context = await getContext(req, res, pageDataPath, globalDataPath);
      var compiledTpl = new Velocity({
        root: resolve(options.root),
        template: templatePath,
        macro: resolve(options.macro)
      });
      try {
        const output = compiledTpl.render(context);
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
