const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const pdf = require('html-pdf');

class FileConverter extends LifeforcePlugin {
  constructor(restifyserver, logger, name) {
    super(restifyserver, logger, name);
    this.apiMap = [
      {
        path: "/api/convert/html-pdf",
        type: "post",
        handler: handleHtmlToPDF,
      }
    ];
  }
}

function handleHtmlToPDF(req, res, next) {
  var html = req.body;
  var options = { format: 'Letter' };

  try {
    pdf.create(html, options).toStream(function (err, stream) {
      if (err) {
        res.send(err.message);
        return next();
      }

      stream.pipe(res);
      return next();
    });
  } catch (err) {
    return next(err);
  }

}

module.exports = FileConverter;
