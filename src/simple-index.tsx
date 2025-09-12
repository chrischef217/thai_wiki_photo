import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// CORS 설정
app.use('/api/*', cors())

// 정적 파일 서빙
app.use('/static/*', serveStatic({ root: './public' }))

// 메모리 저장소 (테스트용)
const testData: any[] = []

// 메인 페이지
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thai Wiki Photo Test</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100">
        <div class="container mx-auto p-4">
            <h1 class="text-2xl font-bold mb-4">Photo Upload Test</h1>
            
            <!-- 업로드 폼 -->
            <div class="bg-white p-6 rounded-lg shadow mb-6">
                <h2 class="text-lg font-semibold mb-4">Upload Photo</h2>
                <form id="uploadForm" enctype="multipart/form-data">
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Name:</label>
                        <input type="text" id="name" name="name" class="w-full p-2 border rounded" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Photo:</label>
                        <input type="file" id="photo" name="photo" accept="image/*" class="w-full p-2 border rounded" required>
                    </div>
                    <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Upload</button>
                </form>
            </div>
            
            <!-- 결과 표시 -->
            <div class="bg-white p-6 rounded-lg shadow">
                <h2 class="text-lg font-semibold mb-4">Uploaded Photos</h2>
                <div id="results"></div>
            </div>
        </div>

        <script>
            document.getElementById('uploadForm').addEventListener('submit', async (e) => {
                e.preventDefault()
                
                const formData = new FormData()
                const name = document.getElementById('name').value
                const photo = document.getElementById('photo').files[0]
                
                if (!name || !photo) {
                    alert('Please fill in all fields')
                    return
                }
                
                formData.append('name', name)
                formData.append('photo', photo)
                
                try {
                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    })
                    
                    const result = await response.json()
                    console.log('Upload result:', result)
                    
                    if (result.success) {
                        alert('Upload successful!')
                        loadResults()
                        document.getElementById('uploadForm').reset()
                    } else {
                        alert('Upload failed: ' + result.error)
                    }
                } catch (error) {
                    console.error('Upload error:', error)
                    alert('Upload error: ' + error.message)
                }
            })
            
            async function loadResults() {
                try {
                    const response = await fetch('/api/list')
                    const data = await response.json()
                    
                    const resultsDiv = document.getElementById('results')
                    if (data.length === 0) {
                        resultsDiv.innerHTML = '<p class="text-gray-500">No photos uploaded yet</p>'
                        return
                    }
                    
                    resultsDiv.innerHTML = data.map(item => \`
                        <div class="border p-4 mb-4 rounded">
                            <h3 class="font-semibold">\${item.name}</h3>
                            <p class="text-sm text-gray-600">Uploaded: \${item.timestamp}</p>
                            <div class="mt-2">
                                <img src="\${item.photo}" alt="\${item.name}" class="max-w-xs h-auto rounded" />
                            </div>
                        </div>
                    \`).join('')
                } catch (error) {
                    console.error('Load error:', error)
                }
            }
            
            // 페이지 로드시 결과 표시
            loadResults()
        </script>
    </body>
    </html>
  `)
})

// 파일 업로드 API
app.post('/api/upload', async (c) => {
  try {
    const formData = await c.req.formData()
    const name = formData.get('name') as string
    const photoFile = formData.get('photo') as File
    
    if (!name || !photoFile) {
      return c.json({ success: false, error: 'Missing name or photo' })
    }
    
    console.log('Received file:', photoFile.name, 'Type:', photoFile.type, 'Size:', photoFile.size)
    
    // 파일을 Base64로 변환
    const arrayBuffer = await photoFile.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    const photoDataUrl = \`data:\${photoFile.type};base64,\${base64}\`
    
    // 메모리에 저장
    const item = {
      id: Date.now(),
      name,
      photo: photoDataUrl,
      timestamp: new Date().toISOString(),
      originalName: photoFile.name,
      size: photoFile.size,
      type: photoFile.type
    }
    
    testData.push(item)
    
    console.log('Stored item:', { ...item, photo: 'data:' + photoFile.type + ';base64,[' + base64.length + ' chars]' })
    
    return c.json({ 
      success: true, 
      message: 'Upload successful',
      id: item.id,
      size: photoFile.size,
      type: photoFile.type
    })
  } catch (error) {
    console.error('Upload error:', error)
    return c.json({ success: false, error: error.message })
  }
})

// 목록 조회 API
app.get('/api/list', (c) => {
  return c.json(testData)
})

// 상태 확인 API
app.get('/api/status', (c) => {
  return c.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    itemCount: testData.length,
    environment: 'production'
  })
})

export default app