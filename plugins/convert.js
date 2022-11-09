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
    pdf.create(html, options).toStream((err, stream) => {
      if (err) {
        console.log("Got to here bad")
        return next(err);
      }

      console.log("Got to here good")
      stream.pipe(res);
    });
  } catch (err) {
    console.log("Got to here extra bad")
    return next(err);
  }

}

module.exports = FileConverter;
