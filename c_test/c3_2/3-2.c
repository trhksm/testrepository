#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
int main(int argc, char *argv[]){
    int n = atoi(argv[1]);//コマンドライン因数から素数の個数
    int *prime = (int *)malloc(sizeof(int) * n);//動的メモリで大きく確保
    prime[0] = 2;
    int count = 1;
    for (int num = 3; count < n; num+=2){
        bool check = true;
        for (int i = 0; i < count; i++) {
            //割り切れるか確認
            if (num % prime[i] == 0){
                check = false;
                break;
            }
            //上限決めて効率化
            if (prime[i] * prime[i] > num) break;
        }
        //素数追加
        if (check){
            prime[count] = num;
            count++;
        }
    }
    printf("%d",prime[n - 1]);
    free(prime);
    return 0;
}

