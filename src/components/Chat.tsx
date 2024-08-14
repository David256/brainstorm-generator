'use client'
import {
  FunctionComponent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { TbPencilPlus } from 'react-icons/tb'
import { TiDelete } from 'react-icons/ti'
import { BsStars } from 'react-icons/bs'
import { AI } from '@/types'

interface ChatProps {}

const Chat: FunctionComponent<ChatProps> = () => {
  const [ai, setAI] = useState<AI>(() => {
    return {
      topic: '',
      histories: [],
    }
  })

  const [selectedText, setSelectedText] = useState('')
  const [feedbacks, setFeedbacks] = useState<string[]>([])

  const [isSending, setIsSending] = useState(false)
  const [isMenuShown, setIsMenuShown] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)

  const formId = useId()

  /*
  Functions here
  */

  const onTopicChange = (text: string) => {
    setAI({
      topic: text,
      histories: ai.histories,
    })
  }

  const onSubmit = async () => {
    if (isTopicEmpty) {
      alert('Missing the topic')
      return
    }
    console.debug('send:', ai.topic)

    setIsSending(true)

    const newAI: AI = {
      ...ai,
    }

    // Add the feedback
    if (newAI.histories.length > 0) {
      newAI.histories[newAI.histories.length - 1].feedbacks = feedbacks
    } else {
      console.warn('no history found')
    }

    console.info('will send', newAI)

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        body: JSON.stringify(newAI),
        headers: {
          'Content-type': 'application/json',
        },
      })

      const json = await response.json()
      console.info(json)

      if (!json.ok) {
        alert('Error')
        return
      }

      if (!Array.isArray(json.ideas)) {
        alert('Bad data received')
        return
      }

      setAI({
        ...ai,
        histories: [
          ...ai.histories,
          {
            ideas: json.ideas,
            feedbacks: [],
          },
        ],
      })

      setFeedbacks([])
    } catch (err) {}

    setIsSending(false)
  }

  const onAddSelected = () => {
    setIsMenuShown(false)

    if (!selectedText) return

    console.debug('add:', selectedText)

    setFeedbacks([...feedbacks, selectedText])

    setSelectedText('')
  }

  useEffect(function showPopupWhenTextSelected() {
    const handleSelection = () => {
      const selection = window.getSelection()
      if (!selection) {
        setIsMenuShown(false)
        return
      }

      setTimeout(() => {
        const selection = window.getSelection()
        if (!selection) return

        const text = selection.toString()
        setSelectedText(text ?? '')

        // Move the menu
        if (selection.rangeCount == 0) return
        const rect = selection.getRangeAt(0).getBoundingClientRect()

        const top = rect.top + window.scrollY - 40
        const left = rect.left + window.scrollX

        if (menuRef.current) {
          menuRef.current.style.top = `${top}px`
          menuRef.current.style.left = `${left}px`
        }

        setIsMenuShown(!!window.getSelection()?.toString())
      }, 300)
    }

    document.addEventListener('mouseup', handleSelection)
    document.addEventListener('keyup', handleSelection)

    return () => {
      document.removeEventListener('mouseup', handleSelection)
      document.removeEventListener('keyup', handleSelection)
    }
  }, [])

  const isTopicEmpty = useMemo(() => !ai.topic || !ai.topic.trim(), [ai.topic])

  const lastIdeaList = useMemo(() => {
    if (ai.histories.length == 0) return []

    return ai.histories[ai.histories.length - 1].ideas
  }, [ai])

  return (
    <>
      <div className="border border-black p-4 flex flex-col gap-4 lg:w-[50vw] w-full">
        <h1 className="text-2xl">Chat</h1>

        <div className="flex flex-col gap-4">
          <label className="block" htmlFor={formId}>
            Write what you want your ideas about
          </label>
          <input
            id={formId}
            className="border border-black p-1 w-full"
            type="text"
            onChange={(event) => onTopicChange(event.currentTarget.value)}
          />
        </div>

        <div className="ideas flex flex-col gap-4 selection:bg-black selection:text-white">
          <h3 className="text-xl">Generated Ideas:</h3>
          <ul>
            {lastIdeaList.map((ideas, i) => (
              <li key={i}>- {ideas}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <hr />
          <h2 className="text-xl">Feedback list:</h2>
          {feedbacks.map((feedback, i) => (
            <div
              key={i}
              className="p-1 flex flex-row justify-between gap-4 bg-black text-white"
            >
              {feedback}
              <TiDelete
                role="button"
                onClick={() => {
                  const newFeedbacks = [...feedbacks]
                  newFeedbacks.splice(i, 1)
                  setFeedbacks(newFeedbacks)
                }}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-row">
          <button
            onClick={onSubmit}
            disabled={isTopicEmpty || isSending}
            className={`${
              isSending
                ? 'hover:cursor-wait'
                : isTopicEmpty
                ? 'hover:cursor-not-allowed'
                : ''
            } w-full p-3 bg-black text-white text-xl hover:underline justify-center flex flex-row items-center`}
          >
            <BsStars />
            {isSending ? 'Loading...' : 'Send'}
          </button>
        </div>
      </div>

      <div
        ref={menuRef}
        className={`${
          isMenuShown ? '' : 'hidden'
        } absolute bg-black text-white p-1 flex flex-col min-w-40`}
      >
        <div
          onClick={onAddSelected}
          className="hover:text-black hover:bg-white hover:cursor-pointer flex flex-row items-center gap-2"
        >
          <TbPencilPlus />
          Add
        </div>
      </div>
    </>
  )
}

export default Chat
