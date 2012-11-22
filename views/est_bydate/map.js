function(doc) {
  if(doc.unixtime && doc.position=="est" && doc.aveValue)
  	emit(doc.unixtime, doc.aveValue);
}