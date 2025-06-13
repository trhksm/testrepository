def put_vertice(parts,vertices)
  x,y,z = parts[0..2].map(&:to_f)
  vertices.push([x,y,z])
end

def put_face(parts,faces)
  return 0 if parts.length < 4 #error対応
  v1,v2,v3 = parts[1..3].map(&:to_i)
  faces.push([v1,v2,v3])
  return 1
end

def put_normal(vs, f, normals)
  v1 = [vs[f[1]][0]-vs[f[0]][0],vs[f[1]][1]-vs[f[0]][1],vs[f[1]][2]-vs[f[0]][2]]
  v2 = [vs[f[2]][0]-vs[f[0]][0],vs[f[2]][1]-vs[f[0]][1],vs[f[2]][2]-vs[f[0]][2]]
  x,y,z = v1[1]*v2[2] - v1[2]*v2[1], v1[2]*v2[0] - v1[0]*v2[2], v1[0]*v2[1] - v1[1]*v2[0]
  len = Math.sqrt(x**2 + y**2 + z**2)
  x,y,z = x/len, y/len, z/len if len != 0
  normals[f[0]].push([x,y,z])
  normals[f[1]].push([x,y,z])
  normals[f[2]].push([x,y,z])
end

def ave(array,out)
  sum = [0.0,0.0,0.0]
  array.each{|a|
    sum[0] += a[0]
    sum[1] += a[1]
    sum[2] += a[2]
  }
  if array.size != 0
    out_x = sum[0].to_f / array.size
    out_y = sum[1].to_f / array.size
    out_z = sum[2].to_f / array.size
    len = Math.sqrt(out_x**2 + out_y**2 + out_z**2)
    if len != 0
      out.push([out_x/len,out_y/len,out_z/len])
    else #error 
      out.push([0.0,1.0,0.0])
      puts("error 表裏が逆のものがあります")
      puts(out_x,out_y,out_z)
    end
  else
    out.push([0.0,1.0,0.0])
    puts("error 使われない点があります")
  end
end

ply_path = "bun_zipper.ply" #ここを変更(読み込み)
obj_path = "bunny2.obj" #ここを変更(出力)

vertices = []
faces = []
normals = []
vertices_normal = []

v_num = 0
v_count = 0
f_num = 0
f_count =0
check_header = true

#v f
fp = open(ply_path,"r")
fp.each{|line|
  line.chomp!
  parts = line.split
  v_num = parts[2].to_i if line.include?("element vertex")
  f_num = parts[2].to_i if line.include?("element face")
  
  if line.include?("end_header")
    check_header = false
  elsif check_header == false 
    if v_count != v_num
      put_vertice(parts,vertices)
      v_count += 1
    elsif f_count != f_num
      f_count += 1 if put_face(parts,faces) == 1
    end
  end
}
fp.close
#nv
v_count.times{
  normals.push([])
  vertices_normal.push([])
}
f_count.times{|i|
  put_normal(vertices,faces[i],normals)
}
v_count.times{|i|
  ave(normals[i],vertices_normal[i])
}

#出力
f_count.times{|i|
  3.times{|k|
    faces[i][k] += 1
  }
}
f_count.times{|i|
  3.times{|k|
    faces[i][k] = faces[i][k].to_s+"//"+faces[i][k].to_s
  }
}
fp1 = open(obj_path,"w")
vertices.each{|v|
  fp1.print("v #{v.join(' ')}\n")
}
vertices_normal.each{|vn|
  fp1.print("vn #{vn.join(' ')}\n")
}
faces.each{|f|
  fp1.print("f #{f.join(' ')}\n")
}
puts "OBJファイル出力完了: #{obj_path}"
