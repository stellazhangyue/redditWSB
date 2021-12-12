#Function to cleanup data
cleanData <- function(x){
  x <- gsub(":", "", x) # Replace junk with ("")
  x <- iconv(x, "latin1", "ASCII", sub=" ")
  x <- gsub("\\s+", " ", x) # Remove double spaces
  return(x)
}

process_text <- function(reddit_GME_sa) {
  gme_corpus <- Corpus(VectorSource(reddit_GME_sa$text), readerControl = list(reader = readPlain, language = "en_US", load = TRUE))
  
  #Clean up the corpus
  gme_corpus <- tm_map(gme_corpus, removePunctuation)
  gme_corpus <- tm_map(gme_corpus, removeNumbers)
  gme_corpus <- tm_map(gme_corpus, stripWhitespace)
  gme_corpus <- tm_map(gme_corpus, content_transformer(tolower))
  
  #Generate Document Term Matrix
  gme_tdm <- TermDocumentMatrix(gme_corpus)
  gme_tdm <- list(tdm = gme_tdm, articleFile = reddit_GME_sa$postid)
  
  gme_matrix <- data.matrix(gme_tdm[["tdm"]])
  
  #Convert matrix to dataframe
  gme_text_df <- as.data.frame(gme_matrix, stringsAsFactors = F)
  
  gme_postid <- gme_tdm[["articleFile"]]
  
  #Bind filenames to columns
  colnames(gme_text_df) <- gme_postid
  
  #Clean data get words from rownames
  gme_text_df$textWords <- cleanData(rownames(gme_text_df)) 
  rownames(gme_text_df) <- NULL
  
  #Transpose columns to rows
  gme_tidy_data <- pivot_longer(gme_text_df, !textWords, "postid", "wordCount")
  colnames(gme_tidy_data) <- c("textWord","postid","wordCount")
  
  #Ignore rows with NA values and wordCount less than 1. Means word does not exist in the article
  gme_tidy_data <- na.omit(gme_tidy_data)
  gme_tidy_data<- gme_tidy_data[gme_tidy_data$wordCount>0, ]
  rownames(gme_tidy_data) <- NULL
  
  #Get stop words from 'tidytext' package and remove from data frame
  lexStopWords <- stop_words
  gme_tidy_data <- gme_tidy_data %>% 
    anti_join(lexStopWords  , by = c("textWord" = "word")) %>% 
    filter(!textWord  %in% c("april", "byteresa", "cfra", "jana","npd", "shopjana","wfm","ihor","amazoncom","anayahooyptryahoo","bloomberg","carolinabased","cincinnatibased","cincinnati", "monday", "month","dusaniwsky"))
  
  #Attach date
  tmp <- str_split(gme_tidy_data$postid, "_")
  gme_tidy_data$textDate <- rapply(tmp, function (x) x[2])
  
  return(gme_tidy_data)
}

get_nrc_sentiments <- function(df) {
  tidy_df <- process_text(df)
  #Get words from bing lexicon
  nrcLexWord <- get_sentiments("nrc")
  
  #Apply sentiment to words
  df_nrc <- tidy_df %>% inner_join(nrcLexWord, by = c("textWord" = "word"))
  
  return(df_nrc)
}