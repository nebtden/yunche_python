<?php
/**
 * Created by PhpStorm.
 * User: Administrator
 * Date: 2018\8\23 0023
 * Time: 15:33
 */

namespace common\components;

use GuzzleHttp\Client;
use Yii;

class DiDi
{
    protected $http = '';
    public static $id = 'didi';
    protected $redis = '';
    protected $url = '';
    protected $key = '';
    protected $secret = '';
    protected $customerKey = '';
    protected $privilegeId = '';
    protected $channel = '';
    protected $data = [
        'headers' => [
            'Content-Type' => 'application/json',
        ],
    ];

    //考虑多个地方状态不一致，因此把滴滴代驾的状态，转换为典典用车的代驾号码
   //1-新单 2-已取消 3-已超时 4-已接单 5-已到达 6-开始服务 7-结束服务 8-计费完成
    public static $order_status = [
        '1'=>0,
        '2'=>401,
        '3'=>506,
        '4'=>301,
        '5'=>302,
        '6'=>303,
        '7'=>501,
        '8'=>501,
    ];


    //因为此接口需要多次循环调用,当抛出错误的时候，直接使用log写入日志表，会被rollback
    public $messages = [];

    public function __construct()
    {

        $this->redis = Yii::$app->redis;
        $this->http = new Client();
        $this->url = \Yii::$app->params['didi']['url'];
        $this->key = \Yii::$app->params['didi']['key'];
        $this->secret = \Yii::$app->params['didi']['secret'];
        $this->customerKey = \Yii::$app->params['didi']['customerKey'];
        $this->privilegeId = \Yii::$app->params['didi']['privilegeId'];
        $this->channel = \Yii::$app->params['didi']['channel'];

    }

    //因为非前置模式，只能写日志到文件。。
    private function log($url, $input, $return)
    {
//        $log = new RequestLog();
//        $log->url = $url;
//        $log->input = $input;
//        $log->return = $return;
//
//        $returnData = \GuzzleHttp\json_decode($return, true);
//        if (isset($returnData['success']) && $returnData['success']) {
//            $log->status = SUCCESS_STATUS;
//        } else {
//            $log->status = ERROR_STATUS;
//        }
//        $log->company = self::$id;
//        $log->c_time = time();
//        $log->save();
        $returnData = \GuzzleHttp\json_decode($return, true);
        if (isset($returnData['success']) && $returnData['success']) {
            $status = SUCCESS_STATUS;
        } else {
            $status = ERROR_STATUS;
        }
        (new DianDian())->requestlog($url, $input, $return, self::$id, $status, 'DiDi');


    }


    protected function urlget($url, $request_data = [])
    {
        $client = new Client();
        $request_data = array_merge($request_data, ['verify' => true]);

        $res = $client->request('GET', $url, $request_data);

        $return_data = $res->getBody()->getContents();
        $return = \GuzzleHttp\json_decode($return_data, true);
        $this->log($url, json_encode($request_data), $return_data);
        return $return;
    }

    protected function urlpost($url, $data)
    {
//        $this->http->setDefaultOption('verify', false);
        $data['verify'] = false;
        $res = $this->http->request('POST', $url, $data);
        $return_data = $res->getBody()->getContents();
        $return = \GuzzleHttp\json_decode($return_data, true);
        $this->log($url, json_encode($data), $return_data);
        return $return;

    }

    //    请求KOP
    public function _request($aPlatParams, $aBizParams, $appSecret)
    {

        $aPlatParams['sign'] = $this->_openAppSign($aPlatParams, $aBizParams, $appSecret);

        $url = $this->url;
        $url .= '?' . http_build_query($aPlatParams);

        $postData = json_encode($aBizParams);

        $this->data['body'] = $postData;
        return $this->urlpost($url, $this->data);

    }


    public function checkToken($post)
    {
        return true;
    }


    public function _openAppSign(array $aPlatParams, array $aBizParams, $appSecret)
    {
        //对业务参数，按照key进行升序排列
        ksort($aBizParams);
        $bizMerges = $this->mergeKeyValue($aBizParams, $appSecret);

        //对系统参数，按照key进行降序排列
        krsort($aPlatParams);
        $sysMerges = $this->mergeKeyValue($aPlatParams, $appSecret);
        return md5($this->calculate($bizMerges, $sysMerges));
    }

    private function mergeKeyValue(array $bizParams, $appSecret)
    {
        $sSign = $appSecret;
        foreach ($bizParams as $k => $v) {
            $sSign .= $k . $v;
        }
        return $sSign . $appSecret;
    }

    private function calculate($bizMerge, $sysMerge)
    {
        $aSign = '';
        $bizLength = strlen($bizMerge);
        $sysLength = strlen($sysMerge);
        $length = $bizLength > $sysLength ? $bizLength : $sysLength;
        for ($i = 0; $i < $length; $i++) {
            $r = 0;
            if ($i < $bizLength && $i < $sysLength) {
                $r = $bizMerge[$i] & $sysMerge[$i];
            } else if ($i < $bizLength) {
                $r = $bizMerge[$i] & 'l';
            } else {
                $r = $sysMerge[$i] & 'l';
            }
            $aSign .= ord($r);
        }
        return $aSign;
    }

    private function getDiDiUserId()
    {
        //从session里面获取$user_id;
        $user = Yii::$app->session['wx_user_auth'];
        $key = 'didi_user_' . $user['uid'];
        $user_id = Yii::$app->session->get($key);
        if ($user_id) {
            return $user_id;
        } else {
            return 0;
        }
    }


    //生成系统参数,不需要登陆
    public function _genPlatParams($ttid, $appKey, $api, $apiVersion, $user_id = 0, $token = '')
    {


        $aPlatParams['ttid'] = $ttid;
        $aPlatParams['api'] = $api;
        $aPlatParams['apiVersion'] = $apiVersion;
        $aPlatParams['appKey'] = $appKey;
        $aPlatParams['timestamp'] = floor(microtime(true) * 1000);
        $aPlatParams['userRole'] = 1;
        $aPlatParams['appVersion'] = '1.0.0';
        $aPlatParams['osType'] = 3;
        $aPlatParams['osVersion'] = 'ttid_server';
        $aPlatParams['hwId'] = 'ttid_server';
        $aPlatParams['mobileType'] = 'ttid_server';
        $aPlatParams['token'] = $token;
        $aPlatParams['userId'] = $user_id;
        $aPlatParams['userRole'] = 1;
        return $aPlatParams;
    }

    public function login($params)
    {
//        $params['customerKey'] = $params['customerKey'];
//        $params['privilegeId'] = $params['privilegeId'];

        $aPlatParams = $this->_genPlatParams($params['ttid'], $this->key, 'lj.nbs.u.loginbyTp', '1.0.0');

        $result = $this->_request($aPlatParams, $params, $this->secret);



        //如果登录之后，可以不再登录
        if ($result && $result['code'] == 200) {
            $data = $result['data'];
        } else {
            return false;
        }

        return $data;


    }

    /**
     * 某个城市是否开启滴滴代驾,可以考虑一直记录
     */
    public function CityOpen($params)
    {
        $aPlatParams = $this->_genPlatParams('yunche', $this->key, 'lj.u.p.getEntrySwitch', '1.0.0');

        $result = $this->_request($aPlatParams, $params, $this->secret);
        if ($result and isset($result['bizSwitch'])) {
            if ($result['bizSwitch'] == 1) {
                return true;
            }
        }
        return false;
    }

    /**
     * 发单接口
     */
    public function Publish($params)
    {
        $user = Yii::$app->session['wx_user_auth'];
        $params['subChannel'] = $this->channel;
        $key = 'didi_token_' . $user['uid'];
        $token = Yii::$app->session->get($key);
        $user_id = $this->getDiDiUserId();
        $aPlatParams = $this->_genPlatParams('yunche', $this->key, 'lj.nbs.o.p.publish', '1.0.0', $user_id, $token);

        $result = $this->_request($aPlatParams, $params, $this->secret);
        return $result;
    }

    /**
     * 取消订单接口
     */
    public function Cancel($params)
    {
        $user_id = $this->getDiDiUserId();
        $aPlatParams = $this->_genPlatParams('yunche', $this->key, 'api= lj.o.p.cancel', '1.0.0', $user_id);

        $result = $this->_request($aPlatParams, $params, $this->secret);
        return $result;
    }

    /**
     * 取消订单接口
     */
    public function CancelReasons($params)
    {
        $user_id = $this->getDiDiUserId();
        $aPlatParams = $this->_genPlatParams('yunche', $this->key, 'lj.o.p.cancelReasons', '1.0.0', $user_id);

        $result = $this->_request($aPlatParams, $params, $this->secret);
        return $result;
    }

    public function OrderDetail($params)
    {
        $user_id = $this->getDiDiUserId();
        $aPlatParams = $this->_genPlatParams('yunche', $this->key, 'lj.o.detail', '1.0.0', $user_id);

        $result = $this->_request($aPlatParams, $params, $this->secret);
        return $result;
    }

    public function Status($params)
    {
        $user_id = $this->getDiDiUserId();
        $aPlatParams = $this->_genPlatParams('yunche', $this->key, 'lj.o.status', '1.0.0', $user_id);

        $result = $this->_request($aPlatParams, $params, $this->secret);
        return $result;
    }

    public function ForFeeDetail($params)
    {
        $user_id = $this->getDiDiUserId();
        $aPlatParams = $this->_genPlatParams('yunche', $this->key, 'lj.o.p.forFeeDetail', '1.0.0', $user_id);

        $result = $this->_request($aPlatParams, $params, $this->secret);
        return $result;
    }

    public function EstimateFee($params)
    {

        $params['subChannel'] = 4;   //yes
        $params['channel'] = $this->channel;   //yes
        $user_id = $this->getDiDiUserId();
        $aPlatParams = $this->_genPlatParams('yunche', $this->key, 'lj.o.p.estimateFee', '1.0.0', $user_id);

        $result = $this->_request($aPlatParams, $params, $this->secret);
        return $result;
    }

    public function QueryOrderBill($params)
    {
        $user_id = $this->getDiDiUserId();
        $aPlatParams = $this->_genPlatParams('yunche', $this->key, 'lj.p.u.queryOrderBill', '1.0.0', $user_id);

        $result = $this->_request($aPlatParams, $params, $this->secret);
        return $result;
    }

    public function GetDriverStatusMsg($params)
    {
        $user_id = $this->getDiDiUserId();
        $aPlatParams = $this->_genPlatParams('yunche', $this->key, 'lj.nbs.o.getDriverStatusMsg', '1.0.0', $user_id);

        $result = $this->_request($aPlatParams, $params, $this->secret);
        return $result;
    }

    //获取高德地图的经纬度
    public function GetAmapLocation($data)
    {
        //根据使用的店铺id，更改地址id
        $url = 'http://restapi.amap.com/v3/assistant/coordinate/convert?key=808c5e9689294e424cf1d6165d14b424&locations=' . $data[0] . ',' . $data[1] . ',39.990475&coordsys=baidu&output=JSON';
        $http = new \GuzzleHttp\Client();
        $result = $http->get($url);
        if ($result['status'] == 1) {
            $locations = $data['locations'];
            $locations = explode(',', $locations);
            $data['lat'] = $locations[0];
            $data['lng'] = $locations[1];
            return $data;
        } else {
            return false;

        }
    }
}


