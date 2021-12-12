build_missing_patterns_df <- function(df) {
  missing_patterns <- data.frame(is.na(df)) %>%
    group_by_all() %>%
    dplyr::count(name = "count", sort = TRUE) %>%
    ungroup()
  return(missing_patterns)
}

plot_missing_patterns <- function(df, percent) {
  missing_patterns = build_missing_patterns_df(df)
  num_missing_patterns <- nrow(missing_patterns)
  
  mp_temp <- missing_patterns %>%
    mutate(rn = factor(row_number())) 
  
  mp_temp <- mp_temp[, -which(names(mp_temp) == "count")] 
  
  is_cc_row <- rep(FALSE, length(mp_temp))
  tmp <- mp_temp[1: length(mp_temp)-1]
  for (i in 1:nrow(tmp)) {
    is_cc_row[i] = all(tmp[i,] == FALSE)
  }
  
  df_main <- mp_temp %>%
    pivot_longer(!rn, names_to = 'variables', values_to='missing') %>%
    mutate(is_cc = is_cc_row[as.numeric(rn)])
  
  col_names <- as.list(colnames(missing_patterns))
  df_missing_agg = data.frame(var = character(), missing_sum = integer(), total_sum = integer(), missing_percentage = double())
  for (i in head(col_names,-1)) {
    temp = missing_patterns[c(i,'count')]
    total_sum = (sum(temp['count']))
    temp = filter(temp, temp[i] == TRUE)
    missing_sum = (sum(temp['count']))
    missing_percentage = missing_sum/total_sum*100
    df_missing_agg = rbind(df_missing_agg, data.frame(var = i, missing_sum = missing_sum, total_sum = total_sum, missing_percentage = missing_percentage))
  }
  
  bar_fill <- "#94B8F6"
  alpha2 <- c(1, 0.5)
  if (percent == FALSE) {
    df_missing_agg <- mutate(df_missing_agg, var = fct_reorder(var,desc(missing_sum)))
    df_missing_agg %>%
      ggplot(aes(x=var,y=missing_sum)) +
      geom_bar(stat='identity', fill = bar_fill) +
      xlab('variable name') +
      ylab('num rows missing') +
      ggtitle('Missing value patterns') +
      theme(axis.title.x = element_blank())-> p1
  } else {
    df_missing_agg <- mutate(df_missing_agg, var = fct_reorder(var,desc(missing_percentage)))
    df_missing_agg %>%
      ggplot(aes(x=var,y=missing_percentage)) +
      geom_bar(stat='identity', fill = bar_fill) +
      scale_y_continuous(limits = c(0, 100)) +
      xlab('variable name') +
      ylab('% rows missing') +
      ggtitle('Missing value patterns') +
      theme(axis.title.x = element_blank())-> p1
  }
  
  if (percent ==FALSE) {
    missing_patterns %>%
      mutate(rn = factor(row_number())) %>%
      mutate(is_cc = is_cc_row[as.numeric(rn)]) %>%
      mutate(rn = fct_relevel(rn,as.character(seq(num_missing_patterns,1,-1)))) %>% 
      ggplot(aes(x=rn,y=count, alpha = is_cc)) +
      geom_bar(stat='identity', fill = bar_fill) +
      scale_alpha_manual(values = alpha2) +
      ylab('row count') +
      coord_flip() +
      theme(axis.title.y = element_blank()) +
      theme(legend.position = "None") -> p3
  }
  else {
    total <- sum(missing_patterns['count'])
    missing_patterns %>%
      mutate(rn = factor(row_number())) %>%
      mutate(is_cc = is_cc_row[as.numeric(rn)]) %>%
      mutate(rn = fct_relevel(rn,as.character(seq(num_missing_patterns,1,-1)))) %>% 
      mutate(missing_percent = count/total * 100) %>%
      ggplot(aes(x=rn, y=missing_percent, alpha = is_cc)) +
      geom_bar(stat='identity', fill = bar_fill) +
      scale_y_continuous(limits = c(0, 100)) +
      scale_alpha_manual(values = alpha2) +
      ylab('% rows') +
      coord_flip() +
      theme(axis.title.y = element_blank()) +
      theme(legend.position = "None") -> p3
  }
  
  df_main %>%
    mutate(rn = fct_relevel(rn,as.character(seq(num_missing_patterns,1,-1)))) %>%  
    mutate(variables = fct_relevel(variables, levels(df_missing_agg$var))) %>%
    mutate(missing = factor(missing)) %>%
    ggplot() +
    geom_tile(aes(x = variables, y = rn, fill = missing, alpha = is_cc), color = "white", lwd = 0.5, linetype = 1) +
    scale_alpha_manual(values = alpha2) +
    scale_colour_manual(
      values = c("FALSE" = "grey", "TRUE"= "#B69FE7"), 
      aesthetics = c("fill")
    ) +
    ggplot2::annotate("text", 
             x=length(missing_patterns[1,])/2, 
             y=num_missing_patterns+1-as.numeric(df_main[as.numeric(as.list(which(df_main$is_cc==TRUE))[1]),'rn']), 
             label = "complete cases") +
    ylab("missing pattern") +
    theme_classic() +
    theme(legend.position = "None") -> p2
  ggplot() + theme_void() -> p4
  ((p1+p4+plot_layout(widths = c(2.55,1)))/(p2+p3 + plot_layout(widths = c(3,1)))) + plot_layout(heights = (c(0.3,1)))
}