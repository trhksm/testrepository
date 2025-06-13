def put_vertice(parts,vertices)
  x,y,z = parts[0..2].map(&:to_f)
  vertices.push([x,y,z])
end

def put_face(parts,faces)
  return if parts.length < 4 #error対応
  v1,v2,v3 = parts[1..3].map(&:to_i)
  faces.push([v1+1,v2+1,v3+1])#obj
end

ply_path = "bun_zipper.ply" #ここを変更
obj_path = "bunny.obj" #ここを変更

vertices = []
faces =[]
v_num = 0
v_count = 0
f_num = 0
f_count =0
check_header = true

fp = open(ply_path,"r")
fp.each{|line|
  line.chomp!
  parts = line.split
  v_num = parts[2].to_i if line.include?("element vertex")
  f_num = parts[2].to_i if line.include?("element face")
  
  if line.include?("end_header")
    check_header = false
  elsif check_header == false && v_count != v_num
    put_vertice(parts,vertices)
    v_count += 1
  elsif f_count != f_num
    put_face(parts,faces)
    f_count += 1
  end
}
fp.close

fp1 = open(obj_path,"w")
vertices.each{|v|
  fp1.print("v #{v.join(' ')}\n")
}
faces.each{|f|
  fp1.print("f #{f.join(' ')}\n")
}
puts "OBJファイル出力完了: #{obj_path}"


