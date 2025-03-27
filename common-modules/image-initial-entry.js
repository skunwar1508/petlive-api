// const Images = require('../models/images')
const path = require('path')
var fs = require('fs');
async function ImageInitialEntry(){
let imageentry = await Images.findOne({ name: 'demo.png' })

    if (!imageentry) {
    let images = ['demo.png'];
    for (let index = 0; index < images.length; index++) {
      imageName = images[index];
      const pathToFile = path.join(__dirname, "/../public/img/"+imageName)
      const pathToNewDestination = path.join(__dirname, "/../uploads", imageName)
      fs.copyFile(pathToFile, pathToNewDestination, function(err,file) {
        if (err) {
          throw err
        } else {
        //   console.log("Successfully copied and moved the file!")
        }
      })
    }
     var newImage = new Images();
    newImage.name = "demo.png",
    newImage.size ="1.3KB"
    newImage.type = "image/png",
    newImage.encoding ="7bit"
    newImage.path ="/uploads/demo.png"
    await newImage.save()
    }
    else{ }

}
// ImageInitialEntry()

module.exports = {};

