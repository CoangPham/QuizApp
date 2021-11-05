
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();

const DATABASE_NAME = 'quizzapi';
const MONGO_URL = `mongodb://localhost:27017/${DATABASE_NAME}`;
let db = null;
let questionCollection = null;
let attemptCollection = null;
async function startServer() {
    const client = await MongoClient.connect(MONGO_URL);
    db = client.db();
    questionCollection = db.collection("questions");
    attemptCollection = db.collection("attempts");
    console.log('connected to database');
    app.listen(3000, function(){
      console.log('Listening on port 3000!');
  });
}
startServer();
// serve static files (html, css, js, images...)
app.use(express.static('public'));
// decode req.body from form-data
app.use(express.urlencoded());
// decode req.body from post body message
app.use(express.json());
// const answers = [
//   "1232",
//   "22322",
//   "232",
//   "1423222"
// ];
// const text = "232+2323*0 =?";
// async function createQue(){
//   await questionCollection.insertOne({answers:answers,text:text, correctAnswer:2,__v:0});
//   const results = await questionCollection.find({}).toArray();
//   console.log(results);
// }
// async function createAttempt(){
//   const questionsArr = await questionCollection.find({}).limit(10).toArray();
//   const correctAnswersObj = {};
//         for(question of questionsArr){
//           correctAnswersObj[question._id] = question.correctAnswer;
//         }
//   await attemptCollection.insertOne({questions:questionsArr,correctAnswers:correctAnswers, startedAt:10,completed:false});
  
// }

app.post('/attempts',async function (req, res){
  
  const arrayQuestion = await questionCollection.aggregate( [ { $sample: {size: 10} } ] ).toArray();
  const startedAt = Date();
  const ObjCorrectAnswer = {};
        for(question of arrayQuestion){
          ObjCorrectAnswer[question._id] = question.correctAnswer;
          delete  question.correctAnswer;
        }
  await attemptCollection.insertOne({questions:arrayQuestion,correctAnswers:ObjCorrectAnswer,startedAt:startedAt,completed:false,__v:0});
  const lastestAttempt = await attemptCollection.find().limit(1).sort({$natural:-1}).toArray();
  const response = {_id:lastestAttempt[0]._id,questions:arrayQuestion,score:0,startedAt:startedAt,completed:false,__v:0};
  console.log(response);
  res.json(response);
  
});
app.post('/attempts/:id/submit',async function (req, res){
  const attID = req.params.id;
  const userAnswers = req.body.answers;
  let count = 0;
  let review = "";
  await attemptCollection.findOne({ _id: ObjectId(attID)}, function(err, attempt) {
    for(answer in userAnswers){
      if(attempt.correctAnswers[answer] == userAnswers[answer]){
        count++;
      }
    }
    if(count<5){
      review = "Practice more to improve it :D";
    }
    if(count>=5 && count<7){
      review = "Good, keep up!";
    }
    if(count>=7 && count<9){
      review = "Well done!";
    }
    if(count>=9 && count<=10){
      review = "Perfect!!";
    }
    const response= {_id:attempt._id,questions:attempt.questions,answers:userAnswers,correctAnswers:attempt.correctAnswers,score:count,startedAt:attempt.startedAt,completed:true,__v:0,scoreText:review};
    res.json(response);
  });
  
  
});







