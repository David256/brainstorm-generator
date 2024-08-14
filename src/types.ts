import * as yup from 'yup'

export interface Prompt {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface History {
  ideas: string[]
  feedbacks: string[]
}

export interface AI {
  topic: string
  histories: History[]
}

export const schema = yup.object().shape({
  topic: yup.string().required('Needed the topic'),
  histories: yup
    .array()
    .of(
      yup.object().shape({
        ideas: yup
          .array()
          .of(yup.string().required('Ideas have to be of type string'))
          .required('Needed the ideas array'),
        feedbacks: yup
          .array()
          .of(yup.string().required('Feedbacks have to be of type string'))
          .required('Needed the feedbacks array'),
      })
    )
    .required('Needed the histories array'),
})
