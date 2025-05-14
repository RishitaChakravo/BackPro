import multer from "multer"
//cb : callback
const storage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, "./public/temp") //where to save the uploaded files temporary storage which will be deleted afterwards
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random()*1E9) //what name to give to the uploaded file
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})

export const upload = multer({storage: storage}) //the storage object is passed to multer