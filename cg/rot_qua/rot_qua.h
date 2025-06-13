//
// 四元数で任意軸回転
//

// 原点を通る任意軸回転
void rot0(double *p0, double *axis, double rad, double *p1);
//  p0  : 回転対象の点
//  axis: 回転軸の方向ベクタ
//  rad : 回転角度[rad]
//  p1  : 回転後の点  [出力用]

// 任意軸回転
void rot(double *p0, double *axis, double *ofs, double rad, double *p1);
//  ofs    : 回転軸を通る１点
//  others : rot0と同じ
