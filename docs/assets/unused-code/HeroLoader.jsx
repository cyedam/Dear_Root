import { useEffect, useRef, useState } from 'react'
import './HeroLoader.css'

/*
 * P1 로딩 화면 (06-site-design.md 6-2 · 7)
 * - '하늘에서 땅으로 내려오는' 장면: 배경이 불러온 만큼 흰색 → hero-lime(#EAF3DC)
 * - 가운데 원형 진행 표시(지름 64, 선 7, leaf-green). 원 안은 비워 두고
 *   100%가 되면 로고의 잎 두 장이 나타난 뒤 약 0.5초 후 히어로로 넘어감
 * - 실제로 불러온 만큼만 차오름 (일부러 기다리게 하지 않음)
 * - 0.3초 안에 다 불러오면 아예 보이지 않음
 * - 문구 · 구름 없음
 */

const SHOW_DELAY = 300 // 이 시간 안에 끝나면 로딩 화면을 띄우지 않음
const LEAF_HOLD = 550 // 잎이 나타난 뒤 히어로로 넘어가기까지
const FADE = 450 // 로딩 화면이 사라지는 시간 (HeroLoader.css와 맞춤)
const C = 2 * Math.PI * 27 // 진행 원 둘레

const WHITE = [255, 255, 255]
const HERO_LIME = [234, 243, 220]
const mix = (t) => `rgb(${WHITE.map((w, i) => Math.round(w + (HERO_LIME[i] - w) * t)).join(',')})`

function HeroLoader({ progress, loaded }) {
  // hidden: 아직 안 띄움 / loading: 차오르는 중 / leaves: 잎 등장 / leaving: 사라지는 중 / gone: 끝
  const [phase, setPhase] = useState('hidden')
  const rootRef = useRef(null)
  const ringRef = useRef(null)
  const target = useRef(0)
  const loadedRef = useRef(false)
  target.current = progress
  loadedRef.current = loaded

  // 0.3초 뒤에도 아직 불러오는 중이면 로딩 화면을 띄움
  useEffect(() => {
    const t = setTimeout(() => {
      setPhase((p) => (p === 'hidden' && !loadedRef.current ? 'loading' : p))
    }, SHOW_DELAY)
    return () => clearTimeout(t)
  }, [])

  // 0.3초 안에 끝났으면 바로 끝
  useEffect(() => {
    if (loaded && phase === 'hidden') setPhase('gone')
  }, [loaded, phase])

  // 진행 원 · 배경색을 부드럽게 따라가게 그림
  useEffect(() => {
    if (phase !== 'loading') return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let shown = 0
    let raf = 0
    const frame = () => {
      shown += (target.current - shown) * (reduce ? 1 : 0.18)
      if (rootRef.current) rootRef.current.style.backgroundColor = mix(shown)
      if (ringRef.current) ringRef.current.style.strokeDashoffset = (C * (1 - shown)).toFixed(1)
      if (loadedRef.current && shown > 0.995) {
        if (rootRef.current) rootRef.current.style.backgroundColor = mix(1)
        if (ringRef.current) ringRef.current.style.strokeDashoffset = '0'
        setPhase('leaves')
        return
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  // 잎이 나타나고 잠시 뒤 사라짐
  useEffect(() => {
    if (phase === 'leaves') {
      const t = setTimeout(() => setPhase('leaving'), LEAF_HOLD)
      return () => clearTimeout(t)
    }
    if (phase === 'leaving') {
      const t = setTimeout(() => setPhase('gone'), FADE)
      return () => clearTimeout(t)
    }
  }, [phase])

  // 로딩 화면이 떠 있는 동안 스크롤을 막음
  useEffect(() => {
    if (phase !== 'loading' && phase !== 'leaves') return
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prev
    }
  }, [phase])

  if (phase === 'hidden' || phase === 'gone') return null

  return (
    <div
      ref={rootRef}
      className={`hero-loader${phase === 'leaving' ? ' is-leaving' : ''}`}
      role="progressbar"
      aria-label="페이지를 불러오는 중"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
    >
      <svg className="hero-loader__ring" width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
        <circle className="hero-loader__track" cx="32" cy="32" r="27" />
        <circle
          ref={ringRef}
          className="hero-loader__fill"
          cx="32"
          cy="32"
          r="27"
          transform="rotate(-90 32 32)"
          strokeDasharray={C.toFixed(1)}
          strokeDashoffset={C.toFixed(1)}
        />
        {/* 로고(src/assets/logo/dear-root-logo.svg)의 잎 두 장 — 모양 · 색 그대로 */}
        <g className={`hero-loader__leaves${phase !== 'loading' ? ' is-shown' : ''}`}>
          <svg x="17" y="22" width="30" height="20" viewBox="1190 75 470 310">
            <path
              fill="#DFE6BB"
              d="M1338.5 375.0C1336.3 374.5 1328.9 373.2 1322.0 372.0C1315.1 370.8 1309.1 369.4 1308.5 368.9C1308.0 368.4 1306.3 368.0 1304.8 368.0C1303.2 368.0 1301.2 367.6 1300.2 367.1C1299.3 366.6 1295.3 365.2 1291.5 364.0C1283.8 361.6 1266.4 353.5 1259.7 349.2C1236.4 334.3 1216.9 311.3 1208.4 288.5C1206.9 284.7 1205.4 281.1 1205.0 280.5C1204.6 279.9 1203.2 275.7 1201.9 271.0C1199.8 263.5 1199.6 260.3 1199.5 243.5C1199.5 223.7 1200.2 219.5 1204.2 213.7C1207.9 208.5 1211.6 207.6 1231.5 207.6C1243.0 207.6 1251.7 208.0 1255.5 208.9C1262.2 210.3 1274.0 213.9 1275.5 214.9C1276.0 215.3 1278.3 216.2 1280.5 216.9C1286.0 218.7 1298.8 224.9 1302.5 227.4C1319.3 239.2 1331.4 251.4 1339.2 264.5C1348.8 280.7 1353.7 294.2 1356.0 310.5C1356.4 313.8 1357.3 319.9 1358.0 324.0C1359.9 336.8 1357.0 363.7 1352.8 371.3C1350.7 375.1 1350.1 375.5 1346.5 375.7C1344.3 375.8 1340.7 375.5 1338.5 375.0Z"
            />
            <path
              fill="#BCD150"
              d="M1389.7 361.9C1384.8 356.3 1382.9 344.0 1382.3 314.0C1381.8 287.7 1383.4 272.1 1389.2 247.0C1391.5 237.1 1396.2 223.0 1398.0 220.7C1399.1 219.3 1400.0 216.6 1400.0 214.7C1400.0 211.4 1403.8 203.0 1409.3 194.3C1410.8 191.9 1412.0 189.6 1412.0 189.0C1412.0 188.4 1412.8 186.7 1413.9 185.2C1414.9 183.7 1417.9 179.1 1420.6 175.0C1425.9 166.8 1432.5 158.2 1437.4 153.4C1439.1 151.6 1442.7 148.0 1445.3 145.4C1447.9 142.7 1451.3 139.5 1452.8 138.3C1454.3 137.0 1457.5 134.3 1460.0 132.2C1464.6 128.3 1475.3 120.9 1478.0 119.6C1478.8 119.3 1481.3 117.9 1483.5 116.6C1489.1 113.2 1498.5 108.6 1505.0 106.1C1508.0 104.9 1511.4 103.5 1512.5 103.0C1513.6 102.6 1517.2 101.2 1520.5 100.0C1523.8 98.8 1527.4 97.5 1528.5 97.0C1536.7 93.9 1551.1 90.7 1566.5 88.5C1571.5 87.8 1581.0 86.4 1587.7 85.4C1598.7 83.8 1601.8 83.7 1617.2 84.8C1639.0 86.3 1640.8 86.9 1646.1 92.8L1650.2 97.5L1649.7 120.0C1649.4 132.4 1648.7 144.3 1648.2 146.5C1647.6 148.7 1646.2 155.4 1645.0 161.5C1642.4 174.6 1640.5 181.9 1637.9 188.2C1636.9 190.8 1636.0 193.5 1636.0 194.2C1636.0 194.9 1635.1 197.2 1634.0 199.3C1632.9 201.3 1632.0 203.7 1632.0 204.5C1632.0 205.3 1631.6 206.8 1631.1 207.8C1630.6 208.7 1629.0 212.4 1627.5 216.0C1624.8 222.4 1615.7 238.2 1613.2 240.8C1612.6 241.5 1612.0 242.6 1612.0 243.1C1612.0 244.5 1605.6 253.5 1596.2 265.5C1583.7 281.4 1561.1 300.7 1544.6 309.5C1531.4 316.6 1528.4 318.3 1527.5 319.1C1527.0 319.6 1525.8 320.0 1524.7 320.0C1523.7 320.0 1521.0 321.0 1518.7 322.2C1512.2 325.5 1511.1 326.0 1509.9 326.0C1509.2 326.0 1506.9 326.9 1504.6 327.9C1502.3 328.9 1498.5 330.3 1496.0 331.0C1493.5 331.7 1490.4 332.7 1489.0 333.2C1485.9 334.5 1474.0 337.8 1468.0 339.1C1460.2 340.9 1450.6 343.2 1447.5 344.1C1445.8 344.5 1440.2 345.9 1435.0 347.1C1429.8 348.4 1424.6 350.0 1423.5 350.7C1422.4 351.4 1420.6 352.0 1419.4 352.0C1418.2 352.0 1416.7 352.7 1416.0 353.5C1415.3 354.3 1414.3 355.0 1413.8 355.0C1413.3 355.0 1410.6 356.7 1407.7 358.8C1397.9 365.9 1393.9 366.6 1389.7 361.9Z"
            />
          </svg>
        </g>
      </svg>
    </div>
  )
}

export default HeroLoader
