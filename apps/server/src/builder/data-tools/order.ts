/** What the three agents are told of the company's data tools. */
export function dataOrder(): string {
  return [
    '## Company data',
    "data_describe lists the company's systems this person may reach, each with the reads it offers.",
    "No table of the company's data is kept yet: data_describe with a table and data_query answer NOT_IN_CATALOG.",
    'When nothing holds what was asked, say so and name what exists that is close. That is an answer, not an error.',
  ].join('\n')
}
