"""Generate original 81px tab icons. Requires Pillow; not a runtime dependency."""
from pathlib import Path
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]/'assets/tabbar'
ROOT.mkdir(parents=True,exist_ok=True)
S=4
for name in ['cook','shopping','mine']:
 for active,color in [(False,'#8a928b'),(True,'#244e3b')]:
  img=Image.new('RGBA',(81*S,81*S));d=ImageDraw.Draw(img)
  def box(coords):return tuple(round(n*S) for n in coords)
  def line(points,width=4):d.line([box(p) for p in points],fill=color,width=width*S,joint='curve')
  def ellipse(coords,width=4):d.ellipse(box(coords),outline=color,width=width*S)
  if name=='cook':
   d.rounded_rectangle(box((18,31,63,63)),radius=10*S,outline=color,width=4*S)
   line([(13,31),(68,31)]);line([(10,39),(18,39)]);line([(63,39),(71,39)])
   d.arc(box((22,16,59,42)),180,360,fill=color,width=4*S)
   line([(36,16),(45,16)])
  elif name=='shopping':
   d.rounded_rectangle(box((18,27,63,67)),radius=6*S,outline=color,width=4*S)
   d.arc(box((29,12,52,42)),180,360,fill=color,width=4*S)
   line([(29,26),(29,35)]);line([(52,26),(52,35)])
  else:
   ellipse((29,12,52,35))
   d.arc(box((17,44,64,87)),180,360,fill=color,width=4*S)
   line([(17,65),(64,65)])
  img.resize((81,81),Image.Resampling.LANCZOS).save(ROOT/(name+('-active' if active else '')+'.png'))
