import './index.less'
import { useRef, useState } from 'react'

// 语音播放按钮：播放状态完全由 <audio> 的播放事件驱动，
// 并以 audio_url 作为 key —— 换了新的识别结果时组件重建，
// 播放状态自动归零，不需要在 effect 里手动 setState
function VoiceButton({ src }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play()
    } else {
      audio.pause()
    }
  }

  return (
    <div className='object-recognition-result__voice' onClick={togglePlay}>
      <i
        className='iconfont icon-yinliang-F'
        style={{ color: isPlaying ? '#ff7a45' : '#515151' }}
      ></i>
      <audio
        src={src}
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      ></audio>
    </div>
  )
}

export default function Index({ recognitionResult }) {
  const data = recognitionResult?.data || {}

  return (
    <div>
      <div className="object-recognition-result result-container">
        <div className="object-recognition-result__header">
          <h2>识别结果</h2>
          <VoiceButton key={data?.audio_url || 'none'} src={data?.audio_url || null} />
        </div>
        <div className="object-recognition-result__content">
          <div className='object-recognition-result__description'>
            <h4>物品介绍</h4>
            <p>{data?.image_description || '暂无介绍'}</p>
          </div>
          <div className='object-recognition-result__safety'>
            <h4>安全提示</h4>
            <p>{data?.safety || '暂无安全提示'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
