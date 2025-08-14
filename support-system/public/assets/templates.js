const templates = {
  felizardo: (title, abstract, keywords, publication, date, criteria) => `
Assume you are a software engineering
researcher conducting a systematic literature review
(SLR). Consider the title, abstract, keywords, publication, and date of a
primary study.

Title: ${title}
Abstract: ${abstract}
Keywords: ${keywords}
Publication venue: ${publication}
Publication date: ${date}

Using a 1-7 Likert scale (1 - Strongly disagree, 2 - Disagree, 3 - Somewhat disagree, 4 - Neutral, 5 - Somewhat agree, 6 - Agree, 7 - Strongly agree,), rate your agreement with the following criteria (only number). 
If you rate near 7 to a inclusion criteria, the study meet with this criteria and should be included. If you rate near 7 to a exclusion criteria, the study also meet with this criteria and should be excluded. 

IMPORTANT: Don't be lenient, is better to exclude a paper in this phase. But, remember if it is not possible to evaluate based on the provided information give the score -1.

${criteria}

give me the result in CSV with the following columns: Criteria, Rate

do not make a file, just a text formatted in csv
`.trim(),

  huotala: (title, abstract, keywords, publication, date, criteriaText, instructions = '') => `
Role: You are a software engineering researcher conducting a systematic literature review (SLR).

Task: Evaluate a primary study using each individual **inclusion/exclusion criterion**

**Likert scale**
- **Value:** An integer from \`1\` to \`7\`
- **Interpretation:** Using a 1-7 Likert scale (1 - Strongly disagree,
2 - Disagree, 3 - Somewhat disagree, 4 - Neutral, 5 - Somewhat agree, 6 - Agree, 7 - Strongly agree,), rate your agreement with the following criteria (only number). 
For inclusion criteria (IC):
Higher ratings (6-7) = study meets the criterion → supports inclusion
Lower ratings (1-3) = study fails the criterion → supports exclusion

For exclusion criteria (EC):
Higher ratings (6-7) = study meets the criterion → supports exclusion
Lower ratings (1-3) = study fails the criterion → supports inclusion

### Inclusion and exclusion criteria:
${criteriaText}

### Additional instructions:
${instructions}

### Primary study:
**Title:** 
""" 
${title}
"""

**Abstract:** 
"""
${abstract}
"""

**Keywords:** 
"""
${keywords}
"""

**Publication venue:** 
"""
${publication}
"""

**Publication date:** 
"""
${date}
"""

give me the result in CSV with the following columns: Criteria, Rate

do not make a file, just a text formatted in csv
`.trim(),

  thode: (title, abstract, keywords, publication, date, criteriaText) => `
Perform the task to the best of your ability.

User Prompt:
Assume you are an expert professor in Software Engineering conducting a
systematic literature review.

Your task is to evaluate studies based on specific criteria:
Inclusion Criteria (IC): Inclusion criteria from primary candidate study
Exclusion Criteria (EC): Exclusion criteria from primary candidate study

For scoring, use only 1 or 0: Assign a score of 1 for strong alignment with all
inclusion criteria. Assign a score of 0 if any inclusion criteria are not satisfied or if
any exclusion criteria are met.

You’ll score studies based on their title, abstracts, keywords, publication venue and date.

Title: ${title}
Abstract: ${abstract}
Keywords: ${keywords}
Publication venue: ${publication}
Publication date: ${date}

For the response, use the following format: Response Format: Begin with ‘‘Score:
X’’ followed by ‘‘Justification:’’ which explains why the study was considered
relevant or not.
`.trim()
};
