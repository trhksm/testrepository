def ave(k,m) #平均値
  return (m[k].sum / m[k].size).to_f.round(1)
end

def med(k,m) #中央値　偶奇分け
  if m[k].size % 2 == 0
    return m[k][(m[k].size) / 2] #偶数個の場合は後半の数値参照
  else 
    return m[k][(m[k].size - 1) / 2] #奇数個の場合
  end
end
m = {}
nn = `ls ./data_2`.split
nn.each{|ny|
  clean = `rm -f ./fig/#{ny}_txt/*`
  ret = `ls ./data_2/#{ny}`.split

  ret.each{|n|
    fp = open("./data_2/#{ny}/#{n}")
    fp1 = open("./fig/#{ny}_txt/#{n[0,4]}.txt" , "w")
    fp.each{|l|
      d = l.split
      if d[1].to_i >= 0 && d[2].to_i >= 0 && d[3].to_i >= 0 then
        k1 = "#{ny}_#{n[0,2]}_temp"; k2 = "#{ny}_#{n[0,2]}_humi"; k3 = "#{ny}_#{n[0,2]}_co2"
        m[k1] = [] if m.has_key?(k1) == false
        m[k1].push(d[1].to_f) #temp
        m[k2] = [] if m.has_key?(k2) == false
        m[k2].push(d[2].to_f) #humi
        m[k3] = [] if m.has_key?(k3) == false
        m[k3].push(d[3].to_f) #co2

        fp1.write("#{d[0]} #{d[1].to_f * 4} #{d[2]} #{d[3]}\n") #軸を揃えるため温度４倍
      end
    }
    fp.close;fp1.close

    #gnuplotで保存
    ret4 = `gnuplot -e "
    set terminal svg;
    set output './fig/#{ny}/#{n[0,4]}.svg';
    set ylabel 'Temperature[C] / Humidity[%]';
    set xlabel 'Time';
    set timefmt '%H:%M:%S';
    set xdata time;
    set format x '%H:%M';
    set style data lines;
    set y2tics;
    set ytics nomirror;
    set yrange [0:100];
    set ytics ('0 / 0' 0,'5 / 20' 20,'10 / 40' 40,'15 / 60' 60,'20 / 80' 80,'25 / 100' 100);
    set xtics nomirror;
    set mxtics 2;
    set y2label 'CO2 [ppm]';
    set xtics rotate by -30;
    set grid;
    plot './fig/#{ny}_txt/#{n[0,4]}.txt' u 1:2 w l lw 2 axes x1y1 title 'Temp',
    './fig/#{ny}_txt/#{n[0,4]}.txt' u 1:3 w l lw 2 axes x1y1 title 'Humi',
    './fig/#{ny}_txt/#{n[0,4]}.txt' u 1:4 w l lw 1 axes x1y2 title 'CO2'"`
  }
}

#データ一覧表示
p " date            : min     : max     : ave     : med     "
s = ["temp","humi","co2"]
s.each{|t|
  m.keys.each{|k|
    m[k].sort! if k.include?(t)
    p sprintf("%-16s : %-7s : %-7s : %-7s : %-7s",k,m[k][0],m[k][-1],ave(k,m),med(k,m)) if k.include?(t)
  }
}
