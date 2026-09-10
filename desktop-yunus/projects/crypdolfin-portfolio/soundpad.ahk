#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
#Warn  ; Enable warnings to assist with detecting common errors.
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.

; ==========================================================
; KENDİ MÜZİKLERİNİZİ/SESLERİNİZİ BURAYA EKLİYORSUNUZ
; Ses dosyalarının .mp3 veya .wav formatında olması ve 
; bu script ile aynı klasörde "sesler" adında bir klasörün 
; içinde olması önerilir. (Örn: sesler\gulumse.mp3)
; ==========================================================

; NumPad 1 tuşu
Numpad1::
    ; Ses dosyasının yolunu aşağıya girin.
    SoundPlay, sesler\ses1.mp3
return

; NumPad 2 tuşu
Numpad2::
    SoundPlay, sesler\ses2.mp3
return

; NumPad 3 tuşu
Numpad3::
    SoundPlay, sesler\ses3.mp3
return

; NumPad 4 tuşu
Numpad4::
    SoundPlay, sesler\ses4.mp3
return

; NumPad 5 tuşu
Numpad5::
    SoundPlay, sesler\ses5.mp3
return

; NumPad 6 tuşu
Numpad6::
    SoundPlay, sesler\ses6.mp3
return

; NumPad 7 tuşu
Numpad7::
    SoundPlay, sesler\ses7.mp3
return

; NumPad 8 tuşu
Numpad8::
    SoundPlay, sesler\ses8.mp3
return

; NumPad 9 tuşu
Numpad9::
    SoundPlay, sesler\ses9.mp3
return

; Çalan sesi durdurmak için NumPad 0 tuşunu kullanabilirsiniz
Numpad0::
    SoundPlay, NonExistent.avi ; AutoHotkey'de çalan sesi durdurmanın pratik yolu geçersiz bir dosya çalmaktır.
return

; Çıkış yapmak için CTRL + Numpad Dot (Nokta) tuşu
^NumpadDot::
    ExitApp
return
