# Regenerates the iOS and Android app icons. Run from the repo root: python3 scripts/make-icons.py "$PWD"  (needs Pillow)
# TOJ wordmark icon: thin geometric strokes, white on black. No font file needed.
import sys, json, os
from PIL import Image, ImageDraw
def icon(size, round_=False, scale=1.0):
    S=2048; im=Image.new('RGBA',(S,S),(0,0,0,0)); d=ImageDraw.Draw(im)
    if round_: d.ellipse((0,0,S-1,S-1),fill='black')
    else: d.rectangle((0,0,S,S),fill='black')
    k=S/1024*scale; cx=S/2; cy=S/2
    w,h,g,t=190*k,250*k,80*k,20*k   # letter width, height, gap, stroke
    x0=cx-(3*w+2*g)/2; top=cy-h/2; bot=cy+h/2; W='white'
    # T
    d.rectangle((x0,top,x0+w,top+t),fill=W); d.rectangle((x0+w/2-t/2,top,x0+w/2+t/2,bot),fill=W)
    # O
    x1=x0+w+g; d.ellipse((x1,top,x1+w,bot),outline=W,width=int(t))
    # J: stem on right, hook at bottom
    x2=x1+w+g; r=w/2
    d.rectangle((x2+w-t,top,x2+w,bot-r),fill=W)
    d.arc((x2,bot-2*r,x2+w,bot),0,180,fill=W,width=int(t))
    return im.resize((size,size),Image.LANCZOS)
root=sys.argv[1]
ios=f'{root}/ios/TojApp/Images.xcassets/AppIcon.appiconset'
icon(1024).convert('RGB').save(f'{ios}/icon-1024.png')
json.dump({"images":[{"filename":"icon-1024.png","idiom":"universal","platform":"ios","size":"1024x1024"}],"info":{"author":"xcode","version":1}},open(f'{ios}/Contents.json','w'),indent=2)
for dpi,px in dict(mdpi=48,hdpi=72,xhdpi=96,xxhdpi=144,xxxhdpi=192).items():
    p=f'{root}/android/app/src/main/res/mipmap-{dpi}'
    icon(px).save(f'{p}/ic_launcher.png'); icon(px,True,0.8).save(f'{p}/ic_launcher_round.png')
# Adaptive (API 26+): transparent foreground at 108dp, letters inside the 66dp safe zone; black background colour.
def fg(px):
    im=icon(px,scale=0.6); a=im.getchannel('R')  # white strokes become alpha
    out=Image.new('RGBA',im.size,(255,255,255,0)); out.putalpha(a); return out
for dpi,px in dict(mdpi=108,hdpi=162,xhdpi=216,xxhdpi=324,xxxhdpi=432).items():
    fg(px).save(f'{root}/android/app/src/main/res/mipmap-{dpi}/ic_launcher_foreground.png')
a=f'{root}/android/app/src/main/res/mipmap-anydpi-v26'; os.makedirs(a,exist_ok=True)
x='<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@android:color/black" />\n    <foreground android:drawable="@mipmap/ic_launcher_foreground" />\n</adaptive-icon>\n'
for n in ('ic_launcher','ic_launcher_round'): open(f'{a}/{n}.xml','w').write(x)
