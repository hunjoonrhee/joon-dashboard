export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="bg-gray-900 border border-white/7 rounded-2xl p-10 max-w-sm w-full text-center">
        <div className="text-5xl mb-5">📬</div>
        <h1 className="text-xl font-bold text-white mb-2">이메일을 확인해줘</h1>
        <p className="text-sm text-gray-400 leading-relaxed mb-6">
          가입한 이메일로 인증 링크를 보냈어.<br />
          링크를 클릭하면 바로 시작할 수 있어.
        </p>
        <p className="text-xs text-gray-600">
          메일이 안 왔다면 스팸함을 확인해봐.
        </p>
      </div>
    </div>
  )
}
