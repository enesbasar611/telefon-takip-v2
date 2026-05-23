<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
	xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
	xmlns:ccts="urn:un:unece:uncefact:documentation:2"
	xmlns:clm54217="urn:un:unece:uncefact:codelist:specification:54217:2001"
	xmlns:clm5639="urn:un:unece:uncefact:codelist:specification:5639:1988"
	xmlns:clm66411="urn:un:unece:uncefact:codelist:specification:66411:2001"
	xmlns:clmIANAMIMEMediaType="urn:un:unece:uncefact:codelist:specification:IANAMIMEMediaType:2003"
	xmlns:fn="http://www.w3.org/2005/xpath-functions" 
	xmlns:link="http://www.xbrl.org/2003/linkbase"
	xmlns:n1="urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2"
	xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2"
	xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2"
	xmlns:xbrldi="http://xbrl.org/2006/xbrldi" 
	xmlns:xbrli="http://www.xbrl.org/2003/instance"
	xmlns:xdt="http://www.w3.org/2005/xpath-datatypes" 
	xmlns:xlink="http://www.w3.org/1999/xlink"
	xmlns:xs="http://www.w3.org/2001/XMLSchema" 
	xmlns:xsd="http://www.w3.org/2001/XMLSchema"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	exclude-result-prefixes="cac cbc ccts clm54217 clm5639 clm66411 clmIANAMIMEMediaType fn link n1 qdt udt xbrldi xbrli xdt xlink xs xsd xsi">
	<xsl:character-map name="a"> 
		<xsl:output-character character="&#128;" string=""/>
		<xsl:output-character character="&#129;" string=""/>
		<xsl:output-character character="&#130;" string=""/>
		<xsl:output-character character="&#131;" string=""/>
		<xsl:output-character character="&#132;" string=""/>
		<xsl:output-character character="&#133;" string=""/>
		<xsl:output-character character="&#134;" string=""/>
		<xsl:output-character character="&#135;" string=""/>
		<xsl:output-character character="&#136;" string=""/>
		<xsl:output-character character="&#137;" string=""/>
		<xsl:output-character character="&#138;" string=""/>
		<xsl:output-character character="&#139;" string=""/>
		<xsl:output-character character="&#140;" string=""/>
		<xsl:output-character character="&#141;" string=""/>
		<xsl:output-character character="&#142;" string=""/>
		<xsl:output-character character="&#143;" string=""/>
		<xsl:output-character character="&#144;" string=""/>
		<xsl:output-character character="&#145;" string=""/>
		<xsl:output-character character="&#146;" string=""/>
		<xsl:output-character character="&#147;" string=""/>
		<xsl:output-character character="&#148;" string=""/>
		<xsl:output-character character="&#149;" string=""/>
		<xsl:output-character character="&#150;" string=""/>
		<xsl:output-character character="&#151;" string=""/>
		<xsl:output-character character="&#152;" string=""/>
		<xsl:output-character character="&#153;" string=""/>
		<xsl:output-character character="&#154;" string=""/>
		<xsl:output-character character="&#155;" string=""/>
		<xsl:output-character character="&#156;" string=""/>
		<xsl:output-character character="&#157;" string=""/>
		<xsl:output-character character="&#158;" string=""/>
		<xsl:output-character character="&#159;" string=""/>
	</xsl:character-map> 
	<xsl:decimal-format name="european" decimal-separator="," grouping-separator="." NaN=""/>
	<xsl:output version="4.0" method="html" indent="no" encoding="UTF-8"
		doctype-public="-//W3C//DTD HTML 4.01 Transitional//EN"
		doctype-system="http://www.w3.org/TR/html4/loose.dtd" use-character-maps="a"/>
	<xsl:param name="SV_OutputFormat" select="'HTML'"/>
	<xsl:variable name="XML" select="/"/>
	
	
	<xsl:template match="/">
		<html>
			<head>
        <script type="text/javascript">
          <![CDATA[var QRCode;!function(){function a(a){this.mode=c.MODE_8BIT_BYTE,this.data=a,this.parsedData=[];for(var b=[],d=0,e=this.data.length;e>d;d++){var f=this.data.charCodeAt(d);f>65536?(b[0]=240|(1835008&f)>>>18,b[1]=128|(258048&f)>>>12,b[2]=128|(4032&f)>>>6,b[3]=128|63&f):f>2048?(b[0]=224|(61440&f)>>>12,b[1]=128|(4032&f)>>>6,b[2]=128|63&f):f>128?(b[0]=192|(1984&f)>>>6,b[1]=128|63&f):b[0]=f,this.parsedData=this.parsedData.concat(b)}this.parsedData.length!=this.data.length&&(this.parsedData.unshift(191),this.parsedData.unshift(187),this.parsedData.unshift(239))}function b(a,b){this.typeNumber=a,this.errorCorrectLevel=b,this.modules=null,this.moduleCount=0,this.dataCache=null,this.dataList=[]}function i(a,b){if(void 0==a.length)throw new Error(a.length+"/"+b);for(var c=0;c<a.length&&0==a[c];)c++;this.num=new Array(a.length-c+b);for(var d=0;d<a.length-c;d++)this.num[d]=a[d+c]}function j(a,b){this.totalCount=a,this.dataCount=b}function k(){this.buffer=[],this.length=0}function m(){return"undefined"!=typeof CanvasRenderingContext2D}function n(){var a=!1,b=navigator.userAgent;return/android/i.test(b)&&(a=!0,aMat=b.toString().match(/android ([0-9]\.[0-9])/i),aMat&&aMat[1]&&(a=parseFloat(aMat[1]))),a}function r(a,b){for(var c=1,e=s(a),f=0,g=l.length;g>=f;f++){var h=0;switch(b){case d.L:h=l[f][0];break;case d.M:h=l[f][1];break;case d.Q:h=l[f][2];break;case d.H:h=l[f][3]}if(h>=e)break;c++}if(c>l.length)throw new Error("Too long data");return c}function s(a){var b=encodeURI(a).toString().replace(/\%[0-9a-fA-F]{2}/g,"a");return b.length+(b.length!=a?3:0)}a.prototype={getLength:function(){return this.parsedData.length},write:function(a){for(var b=0,c=this.parsedData.length;c>b;b++)a.put(this.parsedData[b],8)}},b.prototype={addData:function(b){var c=new a(b);this.dataList.push(c),this.dataCache=null},isDark:function(a,b){if(0>a||this.moduleCount<=a||0>b||this.moduleCount<=b)throw new Error(a+","+b);return this.modules[a][b]},getModuleCount:function(){return this.moduleCount},make:function(){this.makeImpl(!1,this.getBestMaskPattern())},makeImpl:function(a,c){this.moduleCount=4*this.typeNumber+17,this.modules=new Array(this.moduleCount);for(var d=0;d<this.moduleCount;d++){this.modules[d]=new Array(this.moduleCount);for(var e=0;e<this.moduleCount;e++)this.modules[d][e]=null}this.setupPositionProbePattern(0,0),this.setupPositionProbePattern(this.moduleCount-7,0),this.setupPositionProbePattern(0,this.moduleCount-7),this.setupPositionAdjustPattern(),this.setupTimingPattern(),this.setupTypeInfo(a,c),this.typeNumber>=7&&this.setupTypeNumber(a),null==this.dataCache&&(this.dataCache=b.createData(this.typeNumber,this.errorCorrectLevel,this.dataList)),this.mapData(this.dataCache,c)},setupPositionProbePattern:function(a,b){for(var c=-1;7>=c;c++)if(!(-1>=a+c||this.moduleCount<=a+c))for(var d=-1;7>=d;d++)-1>=b+d||this.moduleCount<=b+d||(this.modules[a+c][b+d]=c>=0&&6>=c&&(0==d||6==d)||d>=0&&6>=d&&(0==c||6==c)||c>=2&&4>=c&&d>=2&&4>=d?!0:!1)},getBestMaskPattern:function(){for(var a=0,b=0,c=0;8>c;c++){this.makeImpl(!0,c);var d=f.getLostPoint(this);(0==c||a>d)&&(a=d,b=c)}return b},createMovieClip:function(a,b,c){var d=a.createEmptyMovieClip(b,c),e=1;this.make();for(var f=0;f<this.modules.length;f++)for(var g=f*e,h=0;h<this.modules[f].length;h++){var i=h*e,j=this.modules[f][h];j&&(d.beginFill(0,100),d.moveTo(i,g),d.lineTo(i+e,g),d.lineTo(i+e,g+e),d.lineTo(i,g+e),d.endFill())}return d},setupTimingPattern:function(){for(var a=8;a<this.moduleCount-8;a++)null==this.modules[a][6]&&(this.modules[a][6]=0==a%2);for(var b=8;b<this.moduleCount-8;b++)null==this.modules[6][b]&&(this.modules[6][b]=0==b%2)},setupPositionAdjustPattern:function(){for(var a=f.getPatternPosition(this.typeNumber),b=0;b<a.length;b++)for(var c=0;c<a.length;c++){var d=a[b],e=a[c];if(null==this.modules[d][e])for(var g=-2;2>=g;g++)for(var h=-2;2>=h;h++)this.modules[d+g][e+h]=-2==g||2==g||-2==h||2==h||0==g&&0==h?!0:!1}},setupTypeNumber:function(a){for(var b=f.getBCHTypeNumber(this.typeNumber),c=0;18>c;c++){var d=!a&&1==(1&b>>c);this.modules[Math.floor(c/3)][c%3+this.moduleCount-8-3]=d}for(var c=0;18>c;c++){var d=!a&&1==(1&b>>c);this.modules[c%3+this.moduleCount-8-3][Math.floor(c/3)]=d}},setupTypeInfo:function(a,b){for(var c=this.errorCorrectLevel<<3|b,d=f.getBCHTypeInfo(c),e=0;15>e;e++){var g=!a&&1==(1&d>>e);6>e?this.modules[e][8]=g:8>e?this.modules[e+1][8]=g:this.modules[this.moduleCount-15+e][8]=g}for(var e=0;15>e;e++){var g=!a&&1==(1&d>>e);8>e?this.modules[8][this.moduleCount-e-1]=g:9>e?this.modules[8][15-e-1+1]=g:this.modules[8][15-e-1]=g}this.modules[this.moduleCount-8][8]=!a},mapData:function(a,b){for(var c=-1,d=this.moduleCount-1,e=7,g=0,h=this.moduleCount-1;h>0;h-=2)for(6==h&&h--;;){for(var i=0;2>i;i++)if(null==this.modules[d][h-i]){var j=!1;g<a.length&&(j=1==(1&a[g]>>>e));var k=f.getMask(b,d,h-i);k&&(j=!j),this.modules[d][h-i]=j,e--,-1==e&&(g++,e=7)}if(d+=c,0>d||this.moduleCount<=d){d-=c,c=-c;break}}}},b.PAD0=236,b.PAD1=17,b.createData=function(a,c,d){for(var e=j.getRSBlocks(a,c),g=new k,h=0;h<d.length;h++){var i=d[h];g.put(i.mode,4),g.put(i.getLength(),f.getLengthInBits(i.mode,a)),i.write(g)}for(var l=0,h=0;h<e.length;h++)l+=e[h].dataCount;if(g.getLengthInBits()>8*l)throw new Error("code length overflow. ("+g.getLengthInBits()+">"+8*l+")");for(g.getLengthInBits()+4<=8*l&&g.put(0,4);0!=g.getLengthInBits()%8;)g.putBit(!1);for(;;){if(g.getLengthInBits()>=8*l)break;if(g.put(b.PAD0,8),g.getLengthInBits()>=8*l)break;g.put(b.PAD1,8)}return b.createBytes(g,e)},b.createBytes=function(a,b){for(var c=0,d=0,e=0,g=new Array(b.length),h=new Array(b.length),j=0;j<b.length;j++){var k=b[j].dataCount,l=b[j].totalCount-k;d=Math.max(d,k),e=Math.max(e,l),g[j]=new Array(k);for(var m=0;m<g[j].length;m++)g[j][m]=255&a.buffer[m+c];c+=k;var n=f.getErrorCorrectPolynomial(l),o=new i(g[j],n.getLength()-1),p=o.mod(n);h[j]=new Array(n.getLength()-1);for(var m=0;m<h[j].length;m++){var q=m+p.getLength()-h[j].length;h[j][m]=q>=0?p.get(q):0}}for(var r=0,m=0;m<b.length;m++)r+=b[m].totalCount;for(var s=new Array(r),t=0,m=0;d>m;m++)for(var j=0;j<b.length;j++)m<g[j].length&&(s[t++]=g[j][m]);for(var m=0;e>m;m++)for(var j=0;j<b.length;j++)m<h[j].length&&(s[t++]=h[j][m]);return s};for(var c={MODE_NUMBER:1,MODE_ALPHA_NUM:2,MODE_8BIT_BYTE:4,MODE_KANJI:8},d={L:1,M:0,Q:3,H:2},e={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7},f={PATTERN_POSITION_TABLE:[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],G15:1335,G18:7973,G15_MASK:21522,getBCHTypeInfo:function(a){for(var b=a<<10;f.getBCHDigit(b)-f.getBCHDigit(f.G15)>=0;)b^=f.G15<<f.getBCHDigit(b)-f.getBCHDigit(f.G15);return(a<<10|b)^f.G15_MASK},getBCHTypeNumber:function(a){for(var b=a<<12;f.getBCHDigit(b)-f.getBCHDigit(f.G18)>=0;)b^=f.G18<<f.getBCHDigit(b)-f.getBCHDigit(f.G18);return a<<12|b},getBCHDigit:function(a){for(var b=0;0!=a;)b++,a>>>=1;return b},getPatternPosition:function(a){return f.PATTERN_POSITION_TABLE[a-1]},getMask:function(a,b,c){switch(a){case e.PATTERN000:return 0==(b+c)%2;case e.PATTERN001:return 0==b%2;case e.PATTERN010:return 0==c%3;case e.PATTERN011:return 0==(b+c)%3;case e.PATTERN100:return 0==(Math.floor(b/2)+Math.floor(c/3))%2;case e.PATTERN101:return 0==b*c%2+b*c%3;case e.PATTERN110:return 0==(b*c%2+b*c%3)%2;case e.PATTERN111:return 0==(b*c%3+(b+c)%2)%2;default:throw new Error("bad maskPattern:"+a)}},getErrorCorrectPolynomial:function(a){for(var b=new i([1],0),c=0;a>c;c++)b=b.multiply(new i([1,g.gexp(c)],0));return b},getLengthInBits:function(a,b){if(b>=1&&10>b)switch(a){case c.MODE_NUMBER:return 10;case c.MODE_ALPHA_NUM:return 9;case c.MODE_8BIT_BYTE:return 8;case c.MODE_KANJI:return 8;default:throw new Error("mode:"+a)}else if(27>b)switch(a){case c.MODE_NUMBER:return 12;case c.MODE_ALPHA_NUM:return 11;case c.MODE_8BIT_BYTE:return 16;case c.MODE_KANJI:return 10;default:throw new Error("mode:"+a)}else{if(!(41>b))throw new Error("type:"+b);switch(a){case c.MODE_NUMBER:return 14;case c.MODE_ALPHA_NUM:return 13;case c.MODE_8BIT_BYTE:return 16;case c.MODE_KANJI:return 12;default:throw new Error("mode:"+a)}}},getLostPoint:function(a){for(var b=a.getModuleCount(),c=0,d=0;b>d;d++)for(var e=0;b>e;e++){for(var f=0,g=a.isDark(d,e),h=-1;1>=h;h++)if(!(0>d+h||d+h>=b))for(var i=-1;1>=i;i++)0>e+i||e+i>=b||(0!=h||0!=i)&&g==a.isDark(d+h,e+i)&&f++;f>5&&(c+=3+f-5)}for(var d=0;b-1>d;d++)for(var e=0;b-1>e;e++){var j=0;a.isDark(d,e)&&j++,a.isDark(d+1,e)&&j++,a.isDark(d,e+1)&&j++,a.isDark(d+1,e+1)&&j++,(0==j||4==j)&&(c+=3)}for(var d=0;b>d;d++)for(var e=0;b-6>e;e++)a.isDark(d,e)&&!a.isDark(d,e+1)&&a.isDark(d,e+2)&&a.isDark(d,e+3)&&a.isDark(d,e+4)&&!a.isDark(d,e+5)&&a.isDark(d,e+6)&&(c+=40);for(var e=0;b>e;e++)for(var d=0;b-6>d;d++)a.isDark(d,e)&&!a.isDark(d+1,e)&&a.isDark(d+2,e)&&a.isDark(d+3,e)&&a.isDark(d+4,e)&&!a.isDark(d+5,e)&&a.isDark(d+6,e)&&(c+=40);for(var k=0,e=0;b>e;e++)for(var d=0;b>d;d++)a.isDark(d,e)&&k++;var l=Math.abs(100*k/b/b-50)/5;return c+=10*l}},g={glog:function(a){if(1>a)throw new Error("glog("+a+")");return g.LOG_TABLE[a]},gexp:function(a){for(;0>a;)a+=255;for(;a>=256;)a-=255;return g.EXP_TABLE[a]},EXP_TABLE:new Array(256),LOG_TABLE:new Array(256)},h=0;8>h;h++)g.EXP_TABLE[h]=1<<h;for(var h=8;256>h;h++)g.EXP_TABLE[h]=g.EXP_TABLE[h-4]^g.EXP_TABLE[h-5]^g.EXP_TABLE[h-6]^g.EXP_TABLE[h-8];for(var h=0;255>h;h++)g.LOG_TABLE[g.EXP_TABLE[h]]=h;i.prototype={get:function(a){return this.num[a]},getLength:function(){return this.num.length},multiply:function(a){for(var b=new Array(this.getLength()+a.getLength()-1),c=0;c<this.getLength();c++)for(var d=0;d<a.getLength();d++)b[c+d]^=g.gexp(g.glog(this.get(c))+g.glog(a.get(d)));return new i(b,0)},mod:function(a){if(this.getLength()-a.getLength()<0)return this;for(var b=g.glog(this.get(0))-g.glog(a.get(0)),c=new Array(this.getLength()),d=0;d<this.getLength();d++)c[d]=this.get(d);for(var d=0;d<a.getLength();d++)c[d]^=g.gexp(g.glog(a.get(d))+b);return new i(c,0).mod(a)}},j.RS_BLOCK_TABLE=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],j.getRSBlocks=function(a,b){var c=j.getRsBlockTable(a,b);if(void 0==c)throw new Error("bad rs block @ typeNumber:"+a+"/errorCorrectLevel:"+b);for(var d=c.length/3,e=[],f=0;d>f;f++)for(var g=c[3*f+0],h=c[3*f+1],i=c[3*f+2],k=0;g>k;k++)e.push(new j(h,i));return e},j.getRsBlockTable=function(a,b){switch(b){case d.L:return j.RS_BLOCK_TABLE[4*(a-1)+0];case d.M:return j.RS_BLOCK_TABLE[4*(a-1)+1];case d.Q:return j.RS_BLOCK_TABLE[4*(a-1)+2];case d.H:return j.RS_BLOCK_TABLE[4*(a-1)+3];default:return void 0}},k.prototype={get:function(a){var b=Math.floor(a/8);return 1==(1&this.buffer[b]>>>7-a%8)},put:function(a,b){for(var c=0;b>c;c++)this.putBit(1==(1&a>>>b-c-1))},getLengthInBits:function(){return this.length},putBit:function(a){var b=Math.floor(this.length/8);this.buffer.length<=b&&this.buffer.push(0),a&&(this.buffer[b]|=128>>>this.length%8),this.length++}};var l=[[17,14,11,7],[32,26,20,14],[53,42,32,24],[78,62,46,34],[106,84,60,44],[134,106,74,58],[154,122,86,64],[192,152,108,84],[230,180,130,98],[271,213,151,119],[321,251,177,137],[367,287,203,155],[425,331,241,177],[458,362,258,194],[520,412,292,220],[586,450,322,250],[644,504,364,280],[718,560,394,310],[792,624,442,338],[858,666,482,382],[929,711,509,403],[1003,779,565,439],[1091,857,611,461],[1171,911,661,511],[1273,997,715,535],[1367,1059,751,593],[1465,1125,805,625],[1528,1190,868,658],[1628,1264,908,698],[1732,1370,982,742],[1840,1452,1030,790],[1952,1538,1112,842],[2068,1628,1168,898],[2188,1722,1228,958],[2303,1809,1283,983],[2431,1911,1351,1051],[2563,1989,1423,1093],[2699,2099,1499,1139],[2809,2213,1579,1219],[2953,2331,1663,1273]],o=function(){var a=function(a,b){this._el=a,this._htOption=b};return a.prototype.draw=function(a){function g(a,b){var c=document.createElementNS("http://www.w3.org/2000/svg",a);for(var d in b)b.hasOwnProperty(d)&&c.setAttribute(d,b[d]);return c}var b=this._htOption,c=this._el,d=a.getModuleCount();Math.floor(b.width/d),Math.floor(b.height/d),this.clear();var h=g("svg",{viewBox:"0 0 "+String(d)+" "+String(d),width:"100%",height:"100%",fill:b.colorLight});h.setAttributeNS("http://www.w3.org/2000/xmlns/","xmlns:xlink","http://www.w3.org/1999/xlink"),c.appendChild(h),h.appendChild(g("rect",{fill:b.colorDark,width:"1",height:"1",id:"template"}));for(var i=0;d>i;i++)for(var j=0;d>j;j++)if(a.isDark(i,j)){var k=g("use",{x:String(i),y:String(j)});k.setAttributeNS("http://www.w3.org/1999/xlink","href","#template"),h.appendChild(k)}},a.prototype.clear=function(){for(;this._el.hasChildNodes();)this._el.removeChild(this._el.lastChild)},a}(),p="svg"===document.documentElement.tagName.toLowerCase(),q=p?o:m()?function(){function a(){this._elImage.src=this._elCanvas.toDataURL("image/png"),this._elImage.style.display="block",this._elCanvas.style.display="none"}function d(a,b){var c=this;if(c._fFail=b,c._fSuccess=a,null===c._bSupportDataURI){var d=document.createElement("img"),e=function(){c._bSupportDataURI=!1,c._fFail&&_fFail.call(c)},f=function(){c._bSupportDataURI=!0,c._fSuccess&&c._fSuccess.call(c)};return d.onabort=e,d.onerror=e,d.onload=f,d.src="data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",void 0}c._bSupportDataURI===!0&&c._fSuccess?c._fSuccess.call(c):c._bSupportDataURI===!1&&c._fFail&&c._fFail.call(c)}if(this._android&&this._android<=2.1){var b=1/window.devicePixelRatio,c=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(a,d,e,f,g,h,i,j){if("nodeName"in a&&/img/i.test(a.nodeName))for(var l=arguments.length-1;l>=1;l--)arguments[l]=arguments[l]*b;else"undefined"==typeof j&&(arguments[1]*=b,arguments[2]*=b,arguments[3]*=b,arguments[4]*=b);c.apply(this,arguments)}}var e=function(a,b){this._bIsPainted=!1,this._android=n(),this._htOption=b,this._elCanvas=document.createElement("canvas"),this._elCanvas.width=b.width,this._elCanvas.height=b.height,a.appendChild(this._elCanvas),this._el=a,this._oContext=this._elCanvas.getContext("2d"),this._bIsPainted=!1,this._elImage=document.createElement("img"),this._elImage.style.display="none",this._el.appendChild(this._elImage),this._bSupportDataURI=null};return e.prototype.draw=function(a){var b=this._elImage,c=this._oContext,d=this._htOption,e=a.getModuleCount(),f=d.width/e,g=d.height/e,h=Math.round(f),i=Math.round(g);b.style.display="none",this.clear();for(var j=0;e>j;j++)for(var k=0;e>k;k++){var l=a.isDark(j,k),m=k*f,n=j*g;c.strokeStyle=l?d.colorDark:d.colorLight,c.lineWidth=1,c.fillStyle=l?d.colorDark:d.colorLight,c.fillRect(m,n,f,g),c.strokeRect(Math.floor(m)+.5,Math.floor(n)+.5,h,i),c.strokeRect(Math.ceil(m)-.5,Math.ceil(n)-.5,h,i)}this._bIsPainted=!0},e.prototype.makeImage=function(){this._bIsPainted&&d.call(this,a)},e.prototype.isPainted=function(){return this._bIsPainted},e.prototype.clear=function(){this._oContext.clearRect(0,0,this._elCanvas.width,this._elCanvas.height),this._bIsPainted=!1},e.prototype.round=function(a){return a?Math.floor(1e3*a)/1e3:a},e}():function(){var a=function(a,b){this._el=a,this._htOption=b};return a.prototype.draw=function(a){for(var b=this._htOption,c=this._el,d=a.getModuleCount(),e=Math.floor(b.width/d),f=Math.floor(b.height/d),g=['<table style="border:0;border-collapse:collapse;">'],h=0;d>h;h++){g.push("<tr>");for(var i=0;d>i;i++)g.push('<td style="border:0;border-collapse:collapse;padding:0;margin:0;width:'+e+"px;height:"+f+"px;background-color:"+(a.isDark(h,i)?b.colorDark:b.colorLight)+';"></td>');g.push("</tr>")}g.push("</table>"),c.innerHTML=g.join("");var j=c.childNodes[0],k=(b.width-j.offsetWidth)/2,l=(b.height-j.offsetHeight)/2;k>0&&l>0&&(j.style.margin=l+"px "+k+"px")},a.prototype.clear=function(){this._el.innerHTML=""},a}();QRCode=function(a,b){if(this._htOption={width:256,height:256,typeNumber:4,colorDark:"#000000",colorLight:"#ffffff",correctLevel:d.H},"string"==typeof b&&(b={text:b}),b)for(var c in b)this._htOption[c]=b[c];"string"==typeof a&&(a=document.getElementById(a)),this._android=n(),this._el=a,this._oQRCode=null,this._oDrawing=new q(this._el,this._htOption),this._htOption.text&&this.makeCode(this._htOption.text)},QRCode.prototype.makeCode=function(a){this._oQRCode=new b(r(a,this._htOption.correctLevel),this._htOption.correctLevel),this._oQRCode.addData(a),this._oQRCode.make(),this._el.title=a,this._oDrawing.draw(this._oQRCode),this.makeImage()},QRCode.prototype.makeImage=function(){"function"==typeof this._oDrawing.makeImage&&(!this._android||this._android>=3)&&this._oDrawing.makeImage()},QRCode.prototype.clear=function(){this._oDrawing.clear()},QRCode.CorrectLevel=d}();]]>
        </script>
				<style type="text/css">
					body {
					    background-color: #FFFFFF;
					    font-family: 'Tahoma', "Times New Roman", Times, serif;
					    font-size: 11px;
					    color: #666666;
					}
					h1, h2 {
					    padding-bottom: 3px;
					    padding-top: 3px;
					    margin-bottom: 5px;
					    text-transform: uppercase;
					    font-family: Arial, Helvetica, sans-serif;
					}
					h1 {
					    font-size: 1.4em;
					    text-transform:none;
					}
					h2 {
					    font-size: 1em;
					    color: brown;
					}
					h3 {
					    font-size: 1em;
					    color: #333333;
					    text-align: justify;
					    margin: 0;
					    padding: 0;
					}
					h4 {
					    font-size: 1.1em;
					    font-style: bold;
					    font-family: Arial, Helvetica, sans-serif;
					    color: #000000;
					    margin: 0;
					    padding: 0;
					}
					hr {
					    height:2px;
					    color: #000000;
					    background-color: #000000;
					    border-bottom: 1px solid #000000;
					}
					p, ul, ol {
					    margin-top: 1.5em;
					}
					ul, ol {
					    margin-left: 3em;
					}
					blockquote {
					    margin-left: 3em;
					    margin-right: 3em;
					    font-style: italic;
					}
					a {
					    text-decoration: none;
					    color: #70A300;
					}
					a:hover {
					    border: none;
					    color: #70A300;
					}
					#despatchTable {
					    border-collapse:collapse;
					    font-size:11px;
					    float:right;
					    border-color:gray;
					}
					#ettnTable {
					    border-collapse:collapse;
					    font-size:11px;
					    border-color:gray;
					}
					#customerPartyTable {
					    border-width: 0px;
					    border-spacing:;
					    border-style: inset;
					    border-color: gray;
					    border-collapse: collapse;
					    background-color:
					}
					#customerIDTable {
					    border-width: 2px;
					    border-spacing:;
					    border-style: inset;
					    border-color: gray;
					    border-collapse: collapse;
					    background-color:
					}
					#customerIDTableTd {
					    border-width: 2px;
					    border-spacing:;
					    border-style: inset;
					    border-color: gray;
					    border-collapse: collapse;
					    background-color:
					}
					#lineTable {
					    border-width:2px;
					    border-spacing:;
					    border-style: inset;
					    border-color: black;
					    border-collapse: collapse;
					    background-color:;
					}
					td.lineTableTd {
					    border-width: 1px;
					    padding: 1px;
					    border-style: inset;
					    border-color: black;
					    background-color: white;
					}
					tr.lineTableTr {
					    border-width: 1px;
					    padding: 0px;
					    border-style: inset;
					    border-color: black;
					    background-color: white;
					    -moz-border-radius:;
					}
					#lineTableDummyTd {
					    border-width: 1px;
					    border-color:white;
					    padding: 1px;
					    border-style: inset;
					    border-color: black;
					    background-color: white;
					}
					td.lineTableBudgetTd {
					    border-width: 2px;
					    border-spacing:0px;
					    padding: 1px;
					    border-style: inset;
					    border-color: black;
					    background-color: white;
					    -moz-border-radius:;
					}
					#notesTable {
					    border-width: 2px;
					    border-spacing:;
					    border-style: inset;
					    border-color: black;
					    border-collapse: collapse;
					    background-color:
					}
					#notesTableTd {
					    border-width: 0px;
					    border-spacing:;
					    border-style: inset;
					    border-color: black;
					    border-collapse: collapse;
					    background-color: ;
						vertical-align: top;
					}
					table {
					    border-spacing:0px;
					}
					#budgetContainerTable {
					    border-width: 0px;
					    border-spacing: 0px;
					    border-style: inset;
					    border-color: black;
					    border-collapse: collapse;
					    background-color:;
					}
					td {
					    border-color:gray;
					}</style>
				<title>e-İrsaliye</title>
			</head>
			<body
				style="margin-left=0.6in; margin-right=0.6in; margin-top=0.79in; margin-bottom=0.79in">
				<xsl:for-each select="$XML">
					<table style="border-color:blue; " border="0" cellspacing="0px" width="800"
						cellpadding="0px">
						<tbody>
						
			<tr border="1">
						<td colspan="2">
						<img style="width:600px; height:120px;" align="middle" src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAlgCWAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAE5BOIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9w06n6f1FS1EnU/T+oqWv53P5vW69V+aJI+/4f1qSo4+/4f1qSgt/H81+gUUUUGpMn3R+P8zU6dD9f6CoE+6Px/manTofr/QVovij/gNF8Uf8A+lXqPqP50lKvUfUfzrQ0W69V+aJ6cn3h+P8jTacn3h+P8jQdBNRRRQAVKnQ/X+gqKpU6H6/0FV9h/4kA+lXqPqP50lKvUfUfzrYFuvVfmienp1P0/qKZT06n6f1FB0EtFFFADk+8Px/kamqFPvD8f5Gpqr7D/xIr7D/AMSHp1P0/qKlqJOp+n9RUtD+FerLh8PzYVYqvViiXwx9GWFFFFarZei/I0p7P1/Qcn3h+P8AI1NUKfeH4/yNTVcPi+TNCSPv+H9akqOPv+H9akq18cvRAFWKr1Yqft/P9DX7Hy/UKkj7/h/Wo6kj7/h/WqjvL/ELrD/D+hJSr1H1H86SlXqPqP51ZoT0UUU1uvVfmAVYqvVitJfFH1YBRRRVlQ+L5MsUq9R9R/OkpV6j6j+dRD4fmy/tv/CieiiirLJk+6Px/madTU+6Px/madQBOvQfQfypaReg+g/lS0FQ+L5MKmT7o/H+ZqGpk+6Px/ma1nsv8SNh1WKr1YpVOnz/AEAVeo+o/nU9QL1H1H86nqZbR/wgFSp0P1/oKiqVOh+v9BVy+FfIB9FFFEPh+bAKsVXqxVmn/Pv5hRRRQaFmPqv0/pU9QR9V+n9KnoAKnXoPoP5VBU69B9B/KgBaenU/T+oplPTqfp/UUGv2Pl+pLRRRQUtl6L8ixRRRQMkj7/h/Wpk+8Px/kahj7/h/Wpk+8Px/kaa3XqvzNV8Hyf6k1FFFbip9fl+pOvQfQfypaReg+g/lS1ENn/iZoFTJ90fj/M1DUyfdH4/zNWBNH3/D+tSVHH3/AA/rUlaL+H8n+YEyfdH4/wAzTqan3R+P8zTqtbL0X5AFSp0P1/oKiqVOh+v9BTN1svRfkh9KvUfUfzpKVeo+o/nQMnqxVerFOPxL1/zAVeo+o/nU9QL1H1H86nrSO8v8QBUqdD9f6CoqlTofr/QVZrDZ+v6IfTk+8Px/kabTk+8Px/kaqO0v8JZNViq9WKr/AJ9/MBV6j6j+dT1AvUfUfzqetAHp1P0/qKlqJOp+n9RUtABU69B9B/KoKnXoPoP5UALT06n6f1FMp6dT9P6itKfX5fqVH4ZeiJalTofr/QVFUqdD9f6CtDVbL0X5EydT9P6ipaiTqfp/UVLQMKnXoPoP5VBU69B9B/KgBakj7/h/Wo6kj7/h/WqXwS9UBJUqdD9f6CoqlTofr/QVqtl6L8kay+FfImTqfp/UVLUSdT9P6ipaZMviXyJI+/4f1qSo4+/4f1qSnH4l6/5moVJH3/D+tR1JH3/D+taR3l/iAkoooqwLFOT7w/H+RptOT7w/H+RoGt16r8yarFV6sU4/EvX/ADNI/FL1Qq9R9R/Op6gXqPqP51PW5YUq9R9R/OkpV6j6j+dAE9OT7w/H+RptOT7w/H+Rqo7S/wAIFtOh+v8AQU1Op+n9RTk6H6/0FNTqfp/UUR+GXogJakj7/h/Wo6kj7/h/WtVsvRfkBJSr1H1H86SlXqPqP50yobv/AAsnoooq6e79P1HT3fp+pKnQ/X+gp9MTofr/AEFPrUqPxS9UOT7w/H+RqaoU+8Px/kamoLLFTJ90fj/M1DUyfdH4/wAzWv23/hQDqnXoPoP5VBU69B9B/Kpfx/NfoAtFFFagfzlJ1P0/qKlqJOp+n9RUtfzufzet16r80SR9/wAP61JUcff8P61JQW/j+a/QKKKKDUmT7o/H+ZqdOh+v9BUCfdH4/wAzU6dD9f6CtF8Uf8Bovij/AIB9KvUfUfzpKVeo+o/nWhot16r80T05PvD8f5Gm05PvD8f5Gg6CaiiigAqVOh+v9BUVSp0P1/oKr7D/AMSAfSr1H1H86SlXqPqP51sC3XqvzRPT06n6f1FMp6dT9P6ig6CWiiigByfeH4/yNTVCn3h+P8jU1V9h/wCJFfYf+JD06n6f1FS1EnU/T+oqWh/CvVlw+H5sKsVXqxRL4Y+jLCiiitVsvRfkaU9n6/oOT7w/H+RqaoU+8Px/kamq4fF8maEkff8AD+tSVHH3/D+tSVa+OXogCrFV6sVP2/n+hr9j5fqFSR9/w/rUdSR9/wAP61Ud5f4hdYf4f0JKVeo+o/nSUq9R9R/OrNCeiiimt16r8wCrFV6sVpL4o+rAKKKKsqHxfJlilXqPqP50lKvUfUfzqIfD82X9t/4UT0UUVZZMn3R+P8zTqan3R+P8zTqAJ16D6D+VLSL0H0H8qWgqHxfJhUyfdH4/zNQ1Mn3R+P8AM1rPZf4kbDqsVXqxSqdPn+gCr1H1H86nqBeo+o/nU9TLaP8AhAKlTofr/QVFUqdD9f6Crl8K+QD6KKKIfD82AVYqvVirNP8An38wooooNCzH1X6f0qeoI+q/T+lT0AFTr0H0H8qgqdeg+g/lQAtPTqfp/UUynp1P0/qKDX7Hy/UlooooKWy9F+RYooooGSR9/wAP61Mn3h+P8jUMff8AD+tTJ94fj/I01uvVfmar4Pk/1JqKKK3FT6/L9Sdeg+g/lS0i9B9B/KlqIbP/ABM0Cpk+6Px/mahqZPuj8f5mrAmj7/h/WpKjj7/h/WpK0X8P5P8AMCZPuj8f5mnU1Puj8f5mnVa2XovyAKlTofr/AEFRVKnQ/X+gpm62XovyQ+lXqPqP50lKvUfUfzoGT1YqvVinH4l6/wCYCr1H1H86nqBeo+o/nU9aR3l/iAKlTofr/QVFUqdD9f6CrNYbP1/RD6cn3h+P8jTacn3h+P8AI1Udpf4SyarFV6sVX/Pv5gKvUfUfzqeoF6j6j+dT1oA9Op+n9RUtRJ1P0/qKloAKnXoPoP5VBU69B9B/KgBaenU/T+oplPTqfp/UVpT6/L9So/DL0RLUqdD9f6CoqlTofr/QVoarZei/ImTqfp/UVLUSdT9P6ipaBhU69B9B/KoKnXoPoP5UALUkff8AD+tR1JH3/D+tUvgl6oCSpU6H6/0FRVKnQ/X+grVbL0X5I1l8K+RMnU/T+oqWok6n6f1FS0yZfEvkSR9/w/rUlRx9/wAP61JTj8S9f8zUKkj7/h/Wo6kj7/h/WtI7y/xASUUUVYFinJ94fj/I02nJ94fj/I0DW69V+ZNViq9WKcfiXr/maR+KXqhV6j6j+dT1AvUfUfzqetywpV6j6j+dJSr1H1H86AJ6cn3h+P8AI02nJ94fj/I1Udpf4QLadD9f6Cmp1P0/qKcnQ/X+gpqdT9P6iiPwy9EBLUkff8P61HUkff8AD+tarZei/ICSlXqPqP50lKvUfUfzplQ3f+Fk9FFFXT3fp+o6e79P1JU6H6/0FPpidD9f6Cn1qVH4peqHJ94fj/I1NUKfeH4/yNTUFlipk+6Px/mahqZPuj8f5mtftv8AwoB1Tr0H0H8qgqdeg+g/lUv4/mv0AWiiitQP5yk6n6f1FS1EnU/T+oqWv53P5vW69V+aJI+/4f1qSo4+/wCH9akoLfx/NfoFFFFBqTJ90fj/ADNTp0P1/oKgT7o/H+ZqdOh+v9BWi+KP+A0XxR/wD6Veo+o/nSUq9R9R/OtDRbr1X5onpyfeH4/yNNpyfeH4/wAjQdBNRRRQAVKnQ/X+gqKpU6H6/wBBVfYf+JAPpV6j6j+dJSr1H1H862Bbr1X5onp6dT9P6imU9Op+n9RQdBLRRRQA5PvD8f5GpqhT7w/H+Rqaq+w/8SK+w/8AEh6dT9P6ipaiTqfp/UVLQ/hXqy4fD82FWKr1Yol8MfRlhRRRWq2XovyNKez9f0HJ94fj/I1NUKfeH4/yNTVcPi+TNCSPv+H9akqOPv8Ah/WpKtfHL0QBViq9WKn7fz/Q1+x8v1CpI+/4f1qOpI+/4f1qo7y/xC6w/wAP6ElKvUfUfzpKVeo+o/nVmhPRRRTW69V+YBViq9WK0l8UfVgFFFFWVD4vkyxSr1H1H86SlXqPqP51EPh+bL+2/wDCieiiirLJk+6Px/madTU+6Px/madQBOvQfQfypaReg+g/lS0FQ+L5MKmT7o/H+ZqGpk+6Px/ma1nsv8SNh1WKr1YpVOnz/QBV6j6j+dT1AvUfUfzqepltH/CAVKnQ/X+gqKpU6H6/0FXL4V8gH0UUUQ+H5sAqxVerFWaf8+/mFFFFBoWY+q/T+lT1BH1X6f0qegAqdeg+g/lUFTr0H0H8qAFp6dT9P6imU9Op+n9RQa/Y+X6ktFFFBS2XovyLFFFFAySPv+H9amT7w/H+RqGPv+H9amT7w/H+Rprdeq/M1XwfJ/qTUUUVuKn1+X6k69B9B/KlpF6D6D+VLUQ2f+JmgVMn3R+P8zUNTJ90fj/M1YE0ff8AD+tSVHH3/D+tSVov4fyf5gTJ90fj/M06mp90fj/M06rWy9F+QBUqdD9f6CoqlTofr/QUzdbL0X5IfSr1H1H86SlXqPqP50DJ6sVXqxTj8S9f8wFXqPqP51PUC9R9R/Op60jvL/EAVKnQ/X+gqKpU6H6/0FWaw2fr+iH05PvD8f5Gm05PvD8f5GqjtL/CWTVYqvViq/59/MBV6j6j+dT1AvUfUfzqetAHp1P0/qKlqJOp+n9RUtABU69B9B/KoKnXoPoP5UALT06n6f1FMp6dT9P6itKfX5fqVH4ZeiJalTofr/QVFUqdD9f6CtDVbL0X5EydT9P6ipaiTqfp/UVLQMKnXoPoP5VBU69B9B/KgBakj7/h/Wo6kj7/AIf1ql8EvVASVKnQ/X+gqKpU6H6/0FarZei/JGsvhXyJk6n6f1FS1EnU/T+oqWmTL4l8iSPv+H9akqOPv+H9akpx+Jev+ZqFSR9/w/rUdSR9/wAP61pHeX+ICSiiirAsU5PvD8f5Gm05PvD8f5Gga3XqvzJqsVXqxTj8S9f8zSPxS9UKvUfUfzqeoF6j6j+dT1uWFKvUfUfzpKVeo+o/nQBPTk+8Px/kabTk+8Px/kaqO0v8IFtOh+v9BTU6n6f1FOTofr/QU1Op+n9RRH4ZeiAlqSPv+H9ajqSPv+H9a1Wy9F+QElKvUfUfzpKVeo+o/nTKhu/8LJ6KKKunu/T9R0936fqSp0P1/oKfTE6H6/0FPrUqPxS9UOT7w/H+RqaoU+8Px/kamoLLFTJ90fj/ADNQ1Mn3R+P8zWv23/hQDqnXoPoP5VBU69B9B/Kpfx/NfoAtFFFagfzlJ1P0/qKlqJOp+n9RUtfzufzet16r80SR9/w/rUlRx9/w/rUlBb+P5r9AooooNSZPuj8f5mp06H6/0FQJ90fj/M1OnQ/X+grRfFH/AAGi+KP+AfSr1H1H86SlXqPqP51oaLdeq/NE9OT7w/H+RptOT7w/H+RoOgmooooAKlTofr/QVFUqdD9f6Cq+w/8AEgH0q9R9R/OkpV6j6j+dbAt16r80T09Op+n9RTKenU/T+ooOglooooAcn3h+P8jU1Qp94fj/ACNTVX2H/iRX2H/iQ9Op+n9RUtRJ1P0/qKlofwr1ZcPh+bCrFV6sUS+GPoywooorVbL0X5GlPZ+v6Dk+8Px/kamqFPvD8f5GpquHxfJmhJH3/D+tSVHH3/D+tSVa+OXogCrFV6sVP2/n+hr9j5fqFSR9/wAP61HUkff8P61Ud5f4hdYf4f0JKVeo+o/nSUq9R9R/OrNCeiiimt16r8wCrFV6sVpL4o+rAKKKKsqHxfJlilXqPqP50lKvUfUfzqIfD82X9t/4UT0UUVZZMn3R+P8AM06mp90fj/M06gCdeg+g/lS0i9B9B/KloKh8XyYVMn3R+P8AM1DUyfdH4/zNaz2X+JGw6rFV6sUqnT5/oAq9R9R/Op6gXqPqP51PUy2j/hAKlTofr/QVFUqdD9f6Crl8K+QD6KKKIfD82AVYqvVirNP+ffzCiiig0LMfVfp/Sp6gj6r9P6VPQAVOvQfQfyqCp16D6D+VAC09Op+n9RTKenU/T+ooNfsfL9SWiiigpbL0X5FiiiigZJH3/D+tTJ94fj/I1DH3/D+tTJ94fj/I01uvVfmar4Pk/wBSaiiitxU+vy/UnXoPoP5UtIvQfQfypaiGz/xM0Cpk+6Px/mahqZPuj8f5mrAmj7/h/WpKjj7/AIf1qStF/D+T/MCZPuj8f5mnU1Puj8f5mnVa2XovyAKlTofr/QVFUqdD9f6CmbrZei/JD6Veo+o/nSUq9R9R/OgZPViq9WKcfiXr/mAq9R9R/Op6gXqPqP51PWkd5f4gCpU6H6/0FRVKnQ/X+gqzWGz9f0Q+nJ94fj/I02nJ94fj/I1Udpf4SyarFV6sVX/Pv5gKvUfUfzqeoF6j6j+dT1oA9Op+n9RUtRJ1P0/qKloAKnXoPoP5VBU69B9B/KgBaenU/T+oplPTqfp/UVpT6/L9So/DL0RLUqdD9f6CoqlTofr/AEFaGq2XovyJk6n6f1FS1EnU/T+oqWgYVOvQfQfyqCp16D6D+VAC1JH3/D+tR1JH3/D+tUvgl6oCSpU6H6/0FRVKnQ/X+grVbL0X5I1l8K+RMnU/T+oqWok6n6f1FS0yZfEvkSR9/wAP61JUcff8P61JTj8S9f8AM1CpI+/4f1qOpI+/4f1rSO8v8QElFFFWBYpyfeH4/wAjTacn3h+P8jQNbr1X5k1WKr1Ypx+Jev8AmaR+KXqhV6j6j+dT1AvUfUfzqetywpV6j6j+dJSr1H1H86AJ6cn3h+P8jTacn3h+P8jVR2l/hAtp0P1/oKanU/T+opydD9f6Cmp1P0/qKI/DL0QEtSR9/wAP61HUkff8P61qtl6L8gJKVeo+o/nSUq9R9R/OmVDd/wCFk9FFFXT3fp+o6e79P1JU6H6/0FPpidD9f6Cn1qVH4peqHJ94fj/I1NUKfeH4/wAjU1BZYqZPuj8f5moamT7o/H+ZrX7b/wAKAdU69B9B/KoKnXoPoP5VL+P5r9AFooorUD+cpOp+n9RUtRJ1P0/qKlr+dz+b1uvVfmiSPv8Ah/WpKjj7/h/WpKC38fzX6BRRRQakyfdH4/zNTp0P1/oKgT7o/H+ZqdOh+v8AQVovij/gNF8Uf8A+lXqPqP50lKvUfUfzrQ0W69V+aJ6cn3h+P8jTacn3h+P8jQdBNRRRQAVKnQ/X+gqKpU6H6/0FV9h/4kA+lXqPqP50lKvUfUfzrYFuvVfmienp1P0/qKZT06n6f1FB0EtFFFADk+8Px/kamqFPvD8f5Gpqr7D/AMSK+w/8SHp1P0/qKlqJOp+n9RUtD+FerLh8PzYVYqvViiXwx9GWFFFFarZei/I0p7P1/Qcn3h+P8jU1Qp94fj/I1NVw+L5M0JI+/wCH9akqOPv+H9akq18cvRAFWKr1Yqft/P8AQ1+x8v1CpI+/4f1qOpI+/wCH9aqO8v8AELrD/D+hJSr1H1H86SlXqPqP51ZoT0UUU1uvVfmAVYqvVitJfFH1YBRRRVlQ+L5MsUq9R9R/OkpV6j6j+dRD4fmy/tv/AAonoooqyyZPuj8f5mnU1Puj8f5mnUATr0H0H8qWkXoPoP5UtBUPi+TCpk+6Px/mahqZPuj8f5mtZ7L/ABI2HVYqvVilU6fP9AFXqPqP51PUC9R9R/Op6mW0f8IBUqdD9f6CoqlTofr/AEFXL4V8gH0UUUQ+H5sAqxVerFWaf8+/mFFFFBoWY+q/T+lT1BH1X6f0qegAqdeg+g/lUFTr0H0H8qAFp6dT9P6imU9Op+n9RQa/Y+X6ktFFFBS2XovyLFFFFAySPv8Ah/Wpk+8Px/kahj7/AIf1qZPvD8f5Gmt16r8zVfB8n+pNRRRW4qfX5fqTr0H0H8qWkXoPoP5UtRDZ/wCJmgVMn3R+P8zUNTJ90fj/ADNWBNH3/D+tSVHH3/D+tSVov4fyf5gTJ90fj/M06mp90fj/ADNOq1svRfkAVKnQ/X+gqKpU6H6/0FM3Wy9F+SH0q9R9R/OkpV6j6j+dAyerFV6sU4/EvX/MBV6j6j+dT1AvUfUfzqetI7y/xAFSp0P1/oKiqVOh+v8AQVZrDZ+v6IfTk+8Px/kabTk+8Px/kaqO0v8ACWTVYqvViq/59/MBV6j6j+dT1AvUfUfzqetAHp1P0/qKlqJOp+n9RUtABU69B9B/KoKnXoPoP5UALT06n6f1FMp6dT9P6itKfX5fqVH4ZeiJalTofr/QVFUqdD9f6CtDVbL0X5EydT9P6ipaiTqfp/UVLQMKnXoPoP5VBU69B9B/KgBakj7/AIf1qOpI+/4f1ql8EvVASVKnQ/X+gqKpU6H6/wBBWq2XovyRrL4V8iZOp+n9RUtRJ1P0/qKlpky+JfIkj7/h/WpKjj7/AIf1qSnH4l6/5moVJH3/AA/rUdSR9/w/rWkd5f4gJKKKKsCxTk+8Px/kabTk+8Px/kaBrdeq/MmqxVerFOPxL1/zNI/FL1Qq9R9R/Op6gXqPqP51PW5YUq9R9R/OkpV6j6j+dAE9OT7w/H+RptOT7w/H+Rqo7S/wgW06H6/0FNTqfp/UU5Oh+v8AQU1Op+n9RRH4ZeiAlqSPv+H9ajqSPv8Ah/WtVsvRfkBJSr1H1H86SlXqPqP50yobv/Cyeiiirp7v0/UdPd+n6kqdD9f6Cn0xOh+v9BT61Kj8UvVDk+8Px/kamqFPvD8f5GpqCyxUyfdH4/zNQ1Mn3R+P8zWv23/hQDqnXoPoP5VBU69B9B/Kpfx/NfoAtFFFagfzlJ1P0/qKlqJOp+n9RUtfzufzet16r80SR9/w/rUlRx9/w/rUlBb+P5r9AooooNSZPuj8f5mp06H6/wBBUCfdH4/zNTp0P1/oK0XxR/wGi+KP+AfSr1H1H86SlXqPqP51oaLdeq/NE9OT7w/H+RptOT7w/H+RoOgmooooAKlTofr/AEFRVKnQ/X+gqvsP/EgH0q9R9R/OkpV6j6j+dbAt16r80T09Op+n9RTKenU/T+ooOglooooAcn3h+P8AI1NUKfeH4/yNTVX2H/iRX2H/AIkPTqfp/UVLUSdT9P6ipaH8K9WXD4fmwqxVerFEvhj6MsKKKK1Wy9F+RpT2fr+g5PvD8f5GpqhT7w/H+Rqarh8XyZoSR9/w/rUlRx9/w/rUlWvjl6IAqxVerFT9v5/oa/Y+X6hUkff8P61HUkff8P61Ud5f4hdYf4f0JKVeo+o/nSUq9R9R/OrNCeiiimt16r8wCrFV6sVpL4o+rAKKKKsqHxfJlilXqPqP50lKvUfUfzqIfD82X9t/4UT0UUVZZMn3R+P8zTqan3R+P8zTqAJ16D6D+VLSL0H0H8qWgqHxfJhUyfdH4/zNQ1Mn3R+P8zWs9l/iRsOqxVerFKp0+f6AKvUfUfzqeoF6j6j+dT1Mto/4QCpU6H6/0FRVKnQ/X+gq5fCvkA+iiiiHw/NgFWKr1YqzT/n38wooooNCzH1X6f0qeoI+q/T+lT0AFTr0H0H8qgqdeg+g/lQAtPTqfp/UUynp1P0/qKDX7Hy/UlooooKWy9F+RYooooGSR9/w/rUyfeH4/wAjUMff8P61Mn3h+P8AI01uvVfmar4Pk/1JqKKK3FT6/L9Sdeg+g/lS0i9B9B/KlqIbP/EzQKmT7o/H+ZqGpk+6Px/masCaPv8Ah/WpKjj7/h/WpK0X8P5P8wJk+6Px/madTU+6Px/madVrZei/IAqVOh+v9BUVSp0P1/oKZutl6L8kPpV6j6j+dJSr1H1H86Bk9WKr1Ypx+Jev+YCr1H1H86nqBeo+o/nU9aR3l/iAKlTofr/QVFUqdD9f6CrNYbP1/RD6cn3h+P8AI02nJ94fj/I1Udpf4SyarFV6sVX/AD7+YCr1H1H86nqBeo+o/nU9aAPTqfp/UVLUSdT9P6ipaACp16D6D+VQVOvQfQfyoAWnp1P0/qKZT06n6f1FaU+vy/UqPwy9ES1KnQ/X+gqKpU6H6/0FaGq2XovyJk6n6f1FS1EnU/T+oqWgYVOvQfQfyqCp16D6D+VAC1JH3/D+tR1JH3/D+tUvgl6oCSpU6H6/0FRVKnQ/X+grVbL0X5I1l8K+RMnU/T+oqWok6n6f1FS0yZfEvkSR9/w/rUlRx9/w/rUlOPxL1/zNQqSPv+H9ajqSPv8Ah/WtI7y/xASUUUVYFinJ94fj/I02nJ94fj/I0DW69V+ZNViq9WKcfiXr/maR+KXqhV6j6j+dT1AvUfUfzqetywpV6j6j+dJSr1H1H86AJ6cn3h+P8jTacn3h+P8AI1Udpf4QLadD9f6Cmp1P0/qKcnQ/X+gpqdT9P6iiPwy9EBLUkff8P61HUkff8P61qtl6L8gJKVeo+o/nSUq9R9R/OmVDd/4WT0UUVdPd+n6jp7v0/UlTofr/AEFPpidD9f6Cn1qVH4peqHJ94fj/ACNTVCn3h+P8jU1BZYqZPuj8f5moamT7o/H+ZrX7b/woB1Tr0H0H8qgqdeg+g/lUv4/mv0AWiiitQP5yk6n6f1FS1EnU/T+oqWv53P5vW69V+aJI+/4f1qSo4+/4f1qSgt/H81+gUUUUGpMn3R+P8zU6dD9f6CoE+6Px/manTofr/QVovij/AIDRfFH/AAD6Veo+o/nSUq9R9R/OtDRbr1X5onpyfeH4/wAjTacn3h+P8jQdBNRRRQAVKnQ/X+gqKpU6H6/0FV9h/wCJAPpV6j6j+dJSr1H1H862Bbr1X5onp6dT9P6imU9Op+n9RQdBLRRRQA5PvD8f5GpqhT7w/H+Rqaq+w/8AEivsP/Eh6dT9P6ipaiTqfp/UVLQ/hXqy4fD82FWKr1Yol8MfRlhRRRWq2XovyNKez9f0HJ94fj/I1NUKfeH4/wAjU1XD4vkzQkj7/h/WpKjj7/h/WpKtfHL0QBViq9WKn7fz/Q1+x8v1CpI+/wCH9ajqSPv+H9aqO8v8QusP8P6ElKvUfUfzpKVeo+o/nVmhPRRRTW69V+YBViq9WK0l8UfVgFFFFWVD4vkyxSr1H1H86SlXqPqP51EPh+bL+2/8KJ6KKKssmT7o/H+Zp1NT7o/H+Zp1AE69B9B/KlpF6D6D+VLQVD4vkwqZPuj8f5moamT7o/H+ZrWey/xI2HVYqvVilU6fP9AFXqPqP51PUC9R9R/Op6mW0f8ACAVKnQ/X+gqKpU6H6/0FXL4V8gH0UUUQ+H5sAqxVerFWaf8APv5hRRRQaFmPqv0/pU9QR9V+n9KnoAKnXoPoP5VBU69B9B/KgBaenU/T+oplPTqfp/UUGv2Pl+pLRRRQUtl6L8ixRRRQMkj7/h/Wpk+8Px/kahj7/h/Wpk+8Px/kaa3XqvzNV8Hyf6k1FFFbip9fl+pOvQfQfypaReg+g/lS1ENn/iZoFTJ90fj/ADNQ1Mn3R+P8zVgTR9/w/rUlRx9/w/rUlaL+H8n+YEyfdH4/zNOpqfdH4/zNOq1svRfkAVKnQ/X+gqKpU6H6/wBBTN1svRfkh9KvUfUfzpK/n/8A23f+DjT9ir9hj9pfxN+zJ428C/HL4keKvAEOmx/ELXPhloPhC40Xw3rmraVY67a+HLRvGHjLwk2vahbaVqVlNqtxYyJpun3c50w3s9/a6hBZ7UMPWxMnChTlUlGLk0rK0U0rtycVu0lrdvRI0p051W404uTSu0raLa+rS38z+girFfzF+F/+DsT/AIJg6/cLBrHhr9qnwOhAJu/Evwr8FXtquWAwR4N+K3iu7JUZZttoy4B2szEKfpXQP+Dlb/gjnrUUb3v7T2u+GJHUlrbX/gN8fXlhIAJWSTw/8NtetSecZiuZUJHDdM9H9n46LV8LW0e6ipf+kykaPDYhb0anyV/ybP3gXqPqP51PX5EeBv8AgvD/AMEjPiFcTQaD+3B8L9Pe3VZJG8caP8RPhjCVLMv7m4+JXgvwlb3DAqdyW8sroNrMqhlJ+j/D/wDwU+/4JveKfLGh/t7fse3csrrHHbS/tHfCTT71nYgKosdR8WWl4GYkBQYASeBk1Kw2Ji5c2HrrXrRqf/IMh0aq3pVF/wBuT/8AkWfdFSp0P1/oK838CfF34UfFKCS5+GXxP+HnxFtoUWSa48CeNfDfi6CJH+48kvh/UtQjjRsHazMA3YmvSE6H6/0FQ4yi7SjKL7Si4v7pKL/AqCaTTTTvs009l0aT/AfTk+8Px/kabTk+8Px/kacdpf4SiarFV6sVX/Pv5gKvUfUfzqeoF6j6j+dT1oA9Op+n9RUtRJ1P0/qKloAKnXoPoP5VBU69B9B/KgBaenU/T+oplPTqfp/UVpT6/L9So/DL0RLUqdD9f6CoqlTofr/QVoarZei/ImTqfp/UVLUSdT9P6ipaBhU69B9B/KoKnXoPoP5UALUkff8AD+tR1JH3/D+tUvgl6oCSpU6H6/0FRVKnQ/X+grVbL0X5I1l8K+RMnU/T+oqWok6n6f1FS0yZfEvkSR9/w/rUlRx9/wAP61JTj8S9f8zUKkj7/h/Wo6kj7/h/WtI7y/xASUUUVYFinJ94fj/I02nJ94fj/I0DW69V+ZNViq9WKcfiXr/maR+KXqhV6j6j+dT1AvUfUfzqetywpV6j6j+dJSr1H1H86AJ6cn3h+P8AI02nJ94fj/I1Udpf4QLadD9f6Cmp1P0/qKcnQ/X+gpqdT9P6iiPwy9EBLUkff8P61HUkff8AD+tarZei/ICSlXqPqP50lKvUfUfzplQ3f+Fk9FFFXT3fp+o6e79P1JU6H6/0FPpidD9f6Cn1qVH4peqHJ94fj/I1NUKfeH4/yNTUFlipk+6Px/mahqZPuj8f5mtftv8AwoB1Tr0H0H8qgqdeg+g/lUv4/mv0AWiiitQP5yk6n6f1FS1EnU/T+oqWv53P5vW69V+aJI+/4f1qSo4+/wCH9akoLfx/NfoFFFfmq/8AwVj/AGOo/wBsxf2GW8UeKf8Ahb7eJF8Df23/AMI1/wAW5HxDeEOngA+JP7R/tD/hJGu2XSA40E6ENcP9kNrQvswjehhsRifa/V6NWt7GlKtV9nBy9nSh8VSdtorq9Xo7J2duyhhsRifa/V6FWt7GlKtV9nBy9nSh8VSdtorq9Xo7J2dv0wT7o/H+ZqdOh+v9BUCfdH4/zNTp0P1/oKhfFH/AQvij/gH0q9R9R/OkpV6j6j+daGi3XqvzRPTk+8Px/kabTk+8Px/kaDoJqKKKACpU6H6/0FRVKnQ/X+gqvsP/ABIB9KvUfUfzpKVeo+o/nWwLdeq/NE9PTqfp/UUynp1P0/qKDoJaKKKAHJ94fj/I1NUKfeH4/wAjU1V9h/4kV9h/4kPTqfp/UVLUSdT9P6ipaH8K9WXD4fmwqxVerFEvhj6MsKKKK1Wy9F+RpT2fr+g5PvD8f5GpqhT7w/H+Rqarh8XyZoSR9/w/rUlRx9/w/rUlWvjl6IAqxVerFT9v5/oa/Y+X6hUkff8AD+tR1JH3/D+tVHeX+IXWH+H9CSlXqPqP50lKvUfUfzqzQnoooprdeq/MAqxVerFaS+KPqwCiiirKh8XyZYpV6j6j+dJSr1H1H86iHw/Nl/bf+FE9FFFWWTJ90fj/ADNOpqfdH4/zNOoAnXoPoP5UtIvQfQfypaCofF8mFTJ90fj/ADNQ1Mn3R+P8zWs9l/iRsOqxVerFKp0+f6AKvUfUfzqeoF6j6j+dT1Mto/4QCpU6H6/0FRVKnQ/X+gq5fCvkA+iiiiHw/NgFWKr1YqzT/n38wooooNCzH1X6f0qeoI+q/T+lT0AFTr0H0H8qgqdeg+g/lQAtPTqfp/UUynp1P0/qKDX7Hy/UlooooKWy9F+RYooooGSR9/w/rUyfeH4/yNQx9/w/rUyfeH4/yNNbr1X5mq+D5P8AUmooorcVPr8v1J16D6D+VLSL0H0H8qWohs/8TNAqZPuj8f5moamT7o/H+ZqwJo+/4f1qSo4+/wCH9akrRfw/k/zAmT7o/H+Zp1NT7o/H+Zp1Wtl6L8gCpU6H6/0FRVKnQ/X+gpm62XovyQ+v4LP+Drz/AIJ7DwT8TvBH/BRHwO9lF4c+MV94b+Dvxn0RLSSG7tPif4f8L6tN4K8cLeLcS293Y+Kvh94SfwxqNq1lp50nVPBGl3H2zWrrxkYNH/vTr5f/AGz/ANlL4d/tu/sx/Fz9mH4oJMnhf4peG/7Oh1a0JXUPDHifSr6017wb4u01lK7r7wt4r0vR9bjtZCbXUo7KXS9QiuNOvbu3m7cvxTwmKp1W37Nvkqre9OTSbt3i+Wa6+6++vRhqvsasZ/Zfuz/wvf7naS9H3P8AGvVQ7eWc8NgnGD15JzkqcAkjk5469P6Zf2Kf+DWj9tz9uD9l74VftV+CPjX+zN4B8GfGHRbvxH4P8M+PNf8AiM3i1dDttX1LRYb7VYfCvw58RaTZyXsulTXUFlb6neXUFvNCL1La4863i/nZ+Jvwz8a/Bn4k+PPhZ8RtFm8OePPht4y8T+A/Geg3D2802j+KfCWs6h4f17Tnkt5Jba4+x6rp9zCs9tJJa3ESxXFvNJbTRSv/AKLn/BoP+3jofxX/AGP/ABn+w94v8R2EXxL/AGafFeteK/h1odzL5Op6v8EPH+pjWLqfT03lr6PwZ8RdW8QwarHIG+y2Pinw2sZkRGMf3aaaTWqaumtU09U0+zTTXkz6E/Eyb/gzP/4KSL5qwfHj9jO6aPJjRfHHxbjebkgM3mfBoJGDgY3ycZI5ri9R/wCDO3/gq5aXTxWfi79kPUoAIhHeL8YfGVqs/mJk7Yrr4VRTxqGxGA0S78AgsDtP+nMJQrDDBsgHaCGxyR91TwRjHQYOa1YZSTkkkZJOMseeuQFPJHynknjrnkgH+W7e/wDBo5/wWH0WRW0e0/Zx1Us5SV9D+PiWewKpxI/9seGdElZeSECKZAQMx4wa7XS/+Deb/g42+EGneT8MvFXiDSLYSQpHpvwq/bWi8KIwRiIWS3PjPwraBYCzlTvVoQfl2Zy3+nlKokUMoYAf7DqTjkc7D1bjIwR+dQszqoOx15BOVw3J5GduSuAeoDDPPWk0no0n6pP80wP81TTv+CWP/B214bQf2Z8U/wBqhlQgRWzf8FE9G1KCPyzjZHbat8dLi1CYzhJAYcH7mMY9I0P4D/8AB498LIHttMv/AI4a1GJMl9W8efssfF64Jjx9y78Xah4yuwjEH5YphHJnaVdeK/0ZxIhUMWKgYB3CQMQOpB2/MM9cZz7GlF5aR5L3dug7mSaGIjPHAldGbBx6AHsR1h0aMt6VJ3706b/9s/Ulwg94QfrGP/yJ/nlaH8ff+Dwr4WXcV74q+APjz4t2drOksuka3+zn8CtZtbqNSAbSaT4O6T4Q1ySKTGHa01OK6wSy3Csc177pP/BWz/g5Q8Lbf+Fgf8Ecj4giBAk/sL9n79orQ7lsYDbHt/iB4riTGCx3WkmdwxsAwf7tzqOmZA/tGyDZH/Lxbsc8HtIQCe5Ix78CrMNxBJkxXVvJnJPlSW7EjkEFVcd+BkA4zg1lLB4SXxYejptaCj/6S4kOhRe9KHyil+Vj+Oj9j7/gvj+0h4+/bG+An7Hv7bv/AATx8U/sgat+0Jf61ong34g+K/EfjTw5aya9p+haxfaLZ2Pgvxz8NtLl1+HxJ4k06w8GxS6b4wWXS9X1zTmngut4t2/qEr80f+C7XwH0LxR+z/8AA79s+80rXNY1n/gmT+0/8GP21LnTPD0VnNrOvfCf4aePvC2t/HXRYP7QkjQNH8PtJn8TQKl5b7rrwhbRyFrSa5Dfo/pWq6brul6brejX1rqmkaxYWeq6VqdjMlzZajpuoW8d3Y31ncRFo57W7tZori3mjZklikR0JVga8TM8NToTpOlDkhOMk0m2ueMltdtpuLTte2mnU8/F0o05QcI8sZJ33tzJ+bfRmknU/T+oqWok6n6f1FS15ZyBU69B9B/KoKnXoPoP5UALT06n6f1FMrD8Q+K/C/g3TLjXPF/iTQPCmiWsbSXWseJNY07QtLtkQAu8+oapc2tpCijlmkmUKOSQK0g7czeiVrt6Jb7t2QSqU6VKrUqzhSpwjzTqVJwp04RV25TqVJ04Qikm3Kc4xSTbkkm10lSp0P1/oK+KfFv/AAUO/Y18GXUljqfxz8OandxxGZU8Jab4l8a2sy5dQsWr+E9E1jRC5aNvlfUkCgo7lUkjZvMZ/wDgq7+x1bMUTxR4yuxwRJb+BNcVGBA5X7XHascZ5+UHrtBwaxljsFFuMsXhlJbx9vSbXqozk0fI4nxJ8PcDOVHF8ccJ0a1N8lSk8/yypOEkleM44fEYrla63k7dWtj9Kk6n6f1FS1+del/8FT/2LLx9t38SNb0XI4OpfD3x3LknBwP7H0DVjkdxjPoDXuHhT9tv9krxnAlxov7QXwyhSR3jRPEfiK38GXLOj+Xs+x+MRoN4Hdv9UjQBply8QdAWDhjMHUaUMVhpt7KOIotvpt7RPfyOjBcf8C5lJQwHGfCuKm9oUuIMpU3qlpGtjsLJ6tLS920km9D6kqdeg+g/lWZYahYaraQ3+l31nqVjcIklve2FzDeWk8bqHSSG4t3khlR0ZXRkdlZWDAkEGtNeg+g/lXSfWpqSUotSjJJxlFqUZJpNNSi2mmmmmm00002mm1qSPv8Ah/Wo6kj7/h/WqXwS9UMkqVOh+v8AQVFUqdD9f6CtVsvRfkjWXwr5EydT9P6ipaiTqfp/UVLTJl8S+RJH3/D+tSVHH3/D+tSU4/EvX/M1CpI+/wCH9ajqSPv+H9a0jvL/ABASUUUVYFinJ94fj/I02nJ94fj/ACNA1uvVfmTVYqvVinH4l6/5mkfil6oVeo+o/nU9QL1H1H86nrcsKVeo+o/nSUq9R9R/OgCenJ94fj/I02nJ94fj/I1Udpf4QLadD9f6Cmp1P0/qKcnQ/X+gpqdT9P6iiPwy9EBLUkff8P61HUkff8P61qtl6L8gJKVeo+o/nSUq9R9R/OmVDd/4WT0UUVdPd+n6jp7v0/UlTofr/QU+mJ0P1/oKfWpUfil6ocn3h+P8jU1Qp94fj/I1NQWWKmT7o/H+ZqGpk+6Px/ma1+2/8KAdU69B9B/KoKnXoPoP5VL+P5r9AFooorUD+cpOp+n9RUtRJ1P0/qKlr+dz+b1uvVfmiSPv+H9akqOPv+H9akoLfx/NfoFfl/J/wTi/YEb9uJf2tHtLIftIjxEni7/hED8Q7YaG3xDGmrNF46Pw8M/9of8ACUi2C64oEw0ltRx4mOjtqh/tGv1Ar+NTVv8AlaLi/wCyh6L/AOsdWFe1k2HrYj+0/Y4ythPY5Xiq9T2P/MRTp25sPU96NoVL6tXa1tu7+/k2HrYh5kqOMrYT2OV4qvU9j/zEU6dubD1PejaFS+r1a1tu7/2Yp90fj/M1OnQ/X+gqBPuj8f5mp06H6/0FeSvij/gPJXxR/wAA+lXqPqP50lKvUfUfzrQ0W69V+aJ6cn3h+P8AI02nJ94fj/I0HQTUUUUAFSp0P1/oKiqVOh+v9BVfYf8AiQD6Veo+o/nSUq9R9R/OtgW69V+aJ6enU/T+oplPTqfp/UUHQS0UUUAOT7w/H+RqaoU+8Px/kamqvsP/ABIr7D/xIenU/T+oqWok6n6f1FS0P4V6suHw/NhViq9WKJfDH0ZYUUUVqtl6L8jSns/X9ByfeH4/yNTVCn3h+P8AI1NVw+L5M0JI+/4f1r+bX9t//gpJ+1d8Ef8Agsh+yt+xz8PfGHh7TfgT8VNb/ZusfGXh698FeGtU1a+t/iR8StR8NeK1tvEl9Yy6zYNd6TbxQ27Wl1GbKRTPbbJGZj/SVH3/AA/rX8Yv/BTr/lYz/YR/7Gb9jL/1dOsV7eS0qVbF4qNWnCpGOXY2pFTipJThQcoTSe0ovWL3T1R6uT0qdbEYiNWnCpGOAxtSKnFSSnCi3CaT2lF6xe6ep/Z9Viq9WK8X7fz/AEPP+x8v1CpI+/4f1qOsbxLYa1qvhnxHpfhvXX8LeItS0LVrDQfE0en2OrP4c1q80+5t9L11NK1OKfTdSfSL6SDUF0/UIJrG8a3FtdxSQSSIbhq5K9rytd3sr9Xa7st3ZN2Tsm7Avip6203ey89NdN9NdNNbHQ0q9R9R/Ov5Zf2f/wDgtr8Wv2M/iB8Uv2Yf+Cymg+NNG+KXhrxPeaj8PvjT4J+GelDwj4x8FSJFaW6w6P4P0/QYdV0O4ubSXVvC3jHw3o+prqFvql5ofie20LV/D7Jeeg/B7/gp1+1f/wAFLv28vhp4R/YD0/xT8M/2F/hTe2GoftH/ABa8efDbwldz+OrS21CDVtU8P2d74g03xGvhTUPEmnWsHhPwTouhahD4w8vWtY8b69aWmnaWkGietLJ8ZB1JTVOOHp0nW+uOa+qVIcilD2VVXdSVRtQp01Dnc3yyjGza9SWV4qLnKSpqhCm6v1pzX1acOVSj7OorucqjahCChzufuuMbNr+mCiiivMW69V+Z5wVYqvVitJfFH1YBRRRVlQ+L5MsUq9R9R/OkpV6j6j+dRD4fmy/tv/CieiiirLJk+6Px/madTU+6Px/madQBOvQfQfyr+Zv4w/8ABTD9rXwf/wAF6/AP7BmheMfDtv8As3a/rfw0sdS8Ly+CPDNzrctv4l+DNt4z1ZU8WTWDa/C02vSvcRtHeKYIcW0e2Eba/pkXoPoP5V/FD+0R/wArWXwo/wCxn+C3/rN9lXq5TSp1amNVWnCooZdi6kFOKko1IRTjON9pRez3R6eV04VKmKU4Rny4HETjzJPlnFR5ZK+0l0e6P7X6mT7o/H+ZqGpk+6Px/ma8+ey/xI5B1WK/EX/gut+xd+1n+2/+yr4R+Gv7J/iO2j1jQviZZeJvHnw5vPFsfge2+JfhhNF1Sws7J9cu57TR7t/DutXVprCeHvEN5ZaLqHzap9p/tnQtGtrn7G/4JjfAb47/ALMv7DnwG+CP7SnjRPHXxg8D6FrVr4h1OLWrvxLFpGn6j4r13WPC/g6HxHfKtzrcXgvwxqGkeGEu/ns4V0v+z9Imn0ay0+eToq0KSwlPELE03VlWlTeFSftYQSuqre3K7draqzb5kt3SprDwrKvB1JVJQeHSftIxSuqje1n6W1Vm3dL71XqPqP51PUC9R9R/Op65JbR/wmB/Mj/wR8/4Kaftcftgf8FBv2yf2ffjl4y8Oa/8Mvg5ofxMvvAmlaT4H8M+HL/Trjwz8bND8E6S13rGj2FtqGpLD4fvri2kS9mlE8zLdS7p0D1/TmnQ/X+gr+I7/g3e/wCUuP8AwUa/7Ff41/8ArTPhivub/guR/wAExf8Agol+21+0z+zz8TP2U/HViPhz4H8H6Z4fj0W9+KFz8Om+EXxGtfF+u6xqXxYtoklimu31bR9S8N2j6x4Ti1TxnanwilpHpj28enNJ9Dj8Hhp5isP7WjgaLwuHqOpKFqan9XU2uWLXvVJdW1dp7txT9fF4ahLHqj7SlhKbw9GfO42gpexUnore9OXVtXd93ZP90/2+/i743+Af7FH7Uvxr+Gt/aaX8QPhb8D/iD438HalfadZ6vZ2PiHw/4fvNQ0y5udL1COayv4YbqGN3tbqKSCZQUkRlJB+Bf+CCf7bP7QP7en7G3jr4x/tI+I9G8UeO9C/aL8Z/DrTtR0PwvonhO0j8LaL8O/hP4isLSTTdBtbOyluI9U8Wa1K968RuJY54oXcx28QX6J/4KXaXrmif8En/ANr3RfE+unxR4l0j9j3x9pfiHxK1uto3iLXNP+H01pq2utaISlqdXv4bi/NupKwm48tSQor8w/8Ag1L/AOUcvxT/AOzxPiR/6qD4B1y0KVP+x8XVcISqQx2Hpwq8vvKEoT5lFvVRlZNrrpfUwhTp/wBm4mpyxdSOLoQjUt7yg4Tuk3qoysm16X1P6aKsVXr8zP8Agp1/wVA+HH/BMHwJ8MPHnxH+Gnjb4l2XxQ8W6x4R02x8E3+hWF1pl1o+jrrMt3fPrtzbQyW80LeTGsDNIJBlgF5ripUqlepGlSg51Ju0IK15NJuyu0tk3q1sc1OnOrOlTpxcpybUYq127N6XaWyb3Wx+ndFcF8KvH1j8Vvhf8N/ijpdjd6XpnxJ8BeD/AB9p2mX7wyX2nWPjHw9p3iK0sb17dnt3u7S31GO3uXgd4WmjcxMyFSe9qGmm01ZptNdmm018mmvkNpptPRptNdmm0/xTLMfVfp/SvzA/4LLftRfGD9jb/gnp8aP2hPgPrWm+Hvif4M1f4VWegatq+haX4lsLaDxV8VfBvhXWVm0fWbe60+5M+jazfwRNPC5t5ZEuIissSMP0/j6r9P6V+Hf/AAcef8oh/wBpL/sYfgR/6vj4c104KMZ4zCQnFShPEUYyjJXjKMqiTTXVNaNHRhIxlicPGSUoyrU1KLV005Waa6p9T6a/4I8/tL/Fr9sH/gnT+z3+0V8c9Z07X/il8QX+LS+J9W0nQ9M8Oafdjwl8cPiV4I0TyNG0eC206z8jw94a0m2l+zwJ9omhkupt088rt+nC9B9B/KvxK/4N2v8AlDv+yL/10+P/AP6098aK/Pj/AIJbf8Eq/wDgpp+zF/wU/wDiz+0p+0R8WrPWvhBr0XxOTxb4rg+JM3iW8/aPl8UvdjwbNe+EfNk1DRP7B1KfT/FcjeKbXTJPD8+jpoHh9b6xvJZ16K2GoyxGZ3r0sOsNVrOjRcX++tVlFUqSWi5UkktbXWnKpSWtShSdbHXq06PsZ1HSptP95apJKnC2iskkt91pZNr+r2np1P0/qK+Sf25NK/ao1X9lr4s/8MU+L9P8G/tNaVolvr/wvu9X0Twn4g03XtS0LUrPU9U8GXFj4103VPD0Vx4x0G21Tw9pGo38Vtb6Xrt/pd/d31rYQXbn8E/2W/8Ag5b+B/gj4Tx/Dr/go14T+Mnwk/a++FMNx4U+KWj2Xwln+z+N/EOjZhXWLPQ7J9IbwZ4k1iBIZ9f8Na3pHhvQtN1eaZ9EvP7Fnt4bLCjgsRiaUquHiqzhNQnRpu9aKkrxqOno3TbvHmi3aStJLRtU8NVrUXKlH2ji1GVOGtRX1UuTRuDenMm7NWaWh/VPRX89P/BKj9s/9v8A/wCCjH7Tfxo/aX8QaVqfwX/4JqafYXuh/AL4beJ/Ang+28T/ABE8RH+zNL0/WYvGjaHJ4o1Wx020stb8TeML7RvElz4WsPFus6Z4K0C+12z0bW5LP9Av+Crf7PH7Qf7VP7CPxw+Bv7MPjSPwT8XfGVj4dXSpptduvCsPifRNK8T6Rq3inwLN4oswZ9Dj8X6BZ3+jtO5j07UPPGh67cWugarql1Cp4V0cTDDVqtKDbpKrNSc4UHUs5RqOKtz0k/3kYuSjL3ebSVqdB06sKNScIv3FOSfNGk5Wuptac0E/fSbSel9Hb9HKK/FL/ghD+xh+1n+w5+x1rPwo/a28TW934m1T4pa34q8D/D+08Wp44tvhb4Mu9D8P6cfD8ev2091pMB1fXtN1jxE+geHL2+0DTW1H7fFdHWNZ1uC3/a2sq9OFKtUpU6sa8ITcY1YJqNRK3vRTvpq1u1dOzas3FWEYVJwjONSMZNKcfhktNV99uqunZtWZJH3/AA/rUyfeH4/yNeGftJeB/iL8Tf2d/jt8OfhD40/4Vx8VfHnwi+Ifg/4cePfPvLT/AIQ7xv4j8J6tpPhjxH9u06ObUtP/ALJ1i7s7w6lpkMupaaIvt2nRSXtvAjfgz/wb6f8ABN/9vP8AYKvv2lb39rfxNY6Z4R+I1x4aj8HfDOw+IcXxEjvvFelX2t3Ov/FCWWwub3SNAk1ewvbPTFMd0PEPiQM0viaw0/8AsDRvtWtKhSnQrVpYmnTqUp01DDyT56yk1dwd7JR66PZ83KrN7wpxlh6k3VjGULKNNp81RO93F7af53srX/pfoooqTGn1+X6k69B9B/Klry343+FPG/jv4KfF7wP8MvF7fD74keMvhb4/8KfD7x8puFbwP438ReEtW0jwp4vVrRHulbw1r15Ya0DbI9wDZZhRpNoP86v/AAb+/wDBM3/goH+wZ8Q/2mPEv7W3iywsPAnxE07TNO0DwBp/xJHxFTxf47tdek1C8+Lk7WlxdWejyf2R9r0iK41CS28U6+NclbXNNsk0ayM+1CjTnh8RVliKdOpSlHkoST563M9eRrRcvo9neys30xpxlTqTdWMZQ5eWm0+apd68vp8/Oysz+nypk+6Px/mahqZPuj8f5msTImj7/h/WpKjj7/h/WpK0X8P5P8wJk+6Px/madTU+6Px/madVrZei/IAqVOh+v9BUVSp0P1/oKZutl6L8kPpV6j6j+dJSr1H1H86Bn+fh/wAHXP7B2n/B/wDaB+Hv7bvgHSri28K/tM/aPB/xbjgSQ6Xpfxo8EaLp66Jq5kZlgtJviN4Cs/Ni0uzjzPq/w68W+IrxpLrWJpF/EX/gkn+3Ldf8E6v29PgP+09djUrjwR4Y8RXXhn4s6LpDq97r/wAKPG9hc+HfGdjDaPJFHe3enWN4viHS4ZWX/id6LpTRtC67m/1Cv2/f2Q/B/wC3R+yN8bP2afFlhost3488GauvgDXtbsheReBvinp9hc3Xw68c2rRmO9tpfDviYWU9+dPuLW41LQpdY0Kac6fq99BN/j9+PPA3i74aeOfFPw7+IHhzV/B/jnwN4h1Lwp4v8K+ILOTT9a8O+I9CvZdN1vRdWsrjbJbX2majbXFndxyH5biJ9rFcV9lk+K+sYVU5O9TD2pu71lTd/Zy76JezfnBa6nt4Gt7Slyt+9TtF3erj9l/Je78kf7rXh7WPDnjbw9oPi7w9d2ms+HPFOhaR4j0DVrbypINX0TXrCDVNK1O1nt5THNa3un3VvcQSLgNHJ8pliEUrXzpFkgzHHsHQqk0sIH93OyZORjt9MAYx/Ld/wan/APBQq8/ap/YdvP2YPGupQXPxS/Ytn0LwZp0t1em61PxP8EvEh1Of4e6q8DrHeeX4OudO1LwHKytOLfTtP8NRtte52D+pnzbiUAbLfB5BLSKrDHGB8xUN/dOecGvWO0rLpNrM20vOpxyBqGoNnHpi/GMccDvwPSlbwzpc7Eul27D7xOramoI5ByBfAFQR6EjPQZwUf+1FJEcNptHKkTSFfxAtz26/Nn+dPU6vIpJm0u3I+6fIvZsnGPmaS8tI856csCf4aAM2bwT4dkYefp0k4/6b39/OgU9v3l7sKgjoVzwM5OafH4D8Ff8AQtaXIcAYlTzQcDOQrtICe2MkZ6+lcP8AEbx/4O+FujTeIfil8Y/Dfw80Uf6q+1q50Pw/HK5OGt7FdWlubm+uFZsFbOOaXAby4yw3D8t/in/wV7/ZV8E302m+EB8YPjfc27Osl/omoTeEPDUmxsNJbXuqXOkajPbufMYvBoaWvlASxySggngxeaZfgVfF4ujQejUJzXtGn1VOPPO3rFX6dj5LiTjzgzg+KfEvE2T5ROSjKGHxOMpyxs1L4XDAYb61jpJ7qTwsFbZs/ZKHwf4StyskXhrQ4yh4YabYkqvcqfs5bp3wT7dTUzaf4XjH/HpocLJIwGBYW8o4BxlkjZcnJDIR244Jr8CtE/4LbfA99Rgj1v8AZg8WWli1wkc2oReLfD/iS9jiOFa5az1axsmlkjclTBb6kWdsrhgQa/WD9m/9rj9mz9p7RxcfCDX9Hn1uCzfUNV8D6nZ2+geNdIt0lSJ7m+0KY+Y1orvEovbCS6sv3kZaaN5okbLCZ1lWOn7PC46hVqdKd3Ccv8KqRp8z8o8zfTZnlcNeK/hzxfjFl3DvF2VY/MJfw8DOeIwOLrK0mvq2HzLCYCeJk1GT9nhnXq8qcvZcqbXTftU/BGL9o79lv9pH9nbSNYttFb4+fAL4yfBZdV+1pcQaZL8U/hz4l8Bw38qRi5LLZya8t0SIZXVU+WGVlEb/AJF/8EPfjBrHxW/4Jqfs+aD4vSG0+JH7Otl4i/ZM+Jeip5gudA8T/s26/e/C7TbDU0mSKePVb3wNoXg/X76O4ijnE2tEyAsd7fvh59gcYfTQXACos8XnEHjajiTfvwcZR156H1/mD/ZssdU/Y6/4Lyft/wD7Lky3mn/Bz9uv4X+Fv28fg1HdX9zaeGYfilol9ZeEPjjo3hXSZEOmXfivxVquu614l8V3GmSJep4f8B+HGv4HtI7A2umZ0faYWUl8VFqotOi92a/8Blf/ALdPucXDnot9YPm+S0kvuf4H78J1P0/qKlqJOp+n9RUtfLnkBXM+OfHfhD4Z+Edb8dePNfsPDPhTw3YS6jrGsajIywW9vEvyxwwxJLdX19dSlLXTtMsILnUtTvprew061ur24ggk8H/ai/ap8Cfsu+D7TWvEFvceJ/F/iG9h0nwP8OtFuoI/EXirVLiQQq6IUubiy0S0kZBqesJYX7QNJBZ2VjqWq3ljpt1+d95+xt8Z/wBqiA/HD9u34x3fwn8I2QvNW0v4UaT/AGPo9j8P/C0yi4WW91jW7268OeDrwwtFbanJq2k+IfEE9laWjeINXsNUWXT7Dmq13FypUYe2rqMZOHN7OnTjJtKdas04wWjkoRU6s4puMIx98/PeJ+NsTgMXX4f4Tyj/AFo4rpYeGIxWFeMo5fknD2FrRk6OYcUZ3X/2XL6cop4ihllOdTOcfQpVKtDCUMLGWNXnn7SX/BX3Vb2a68NfsyaKNKso5JYLj4k+LdOtrzVLjaqGO58MeGLlb3SLS1diHgv/ABGuqPeRebBNoWk3MPmV+O3xE+KHxF+LPiCbxT8S/GniHxtr8izRLfa3qdxdGxtZZXuG07TY5PNtdL0xJZpJINK02G10y3Z5Bb2yByD+xviW7/4JCfAZINGg8L6t8dNetEazvbzw9qfibxsJSEkcX11qt74m8MfDq4M8gEQm8ONNIrSR7LZIAWTx7Wf2tv8Agnsxki0r9hVb+3+YRyanqmm6BOygja27Tp9ZaNzjOUuWYHbhyenzuMhiK7f1rN8HBar6vRnX9nG7douNCMp1HFNXdTmba+FLRfx5x7h874kxFZcd+N/AVOpGXN/q9lWYcRY/KMDL94lQjgeH8pxWWVJ01J05V8RWzGvOUZylVhKXKvyU35GwMW2EbdpY7B/dOFVFUklmChF3Eswxmjd8pDZYMx4POSeMtnB3cenI9B1/R7Wfjt/wTz13e037FnizQrmZGC3nh740eJYZLZ2Vh5trp9xcvo5kUk8S6e0bYAkicfKfnHxe/wCyVfvax+ArX9ofwmfJuDfP4tufhx45sknJVoBaR6aPA+oIiKJFaS6uZvMwirAGMjHyZYWCsqeNwE+XdKpVoNLvarho3ejWkrrqfjmP4Zy/Cw5cu434IzaKtH2OGx+c5ZJJWULQznhfA4fVWuvrMYwSs5qyPmxS0eCGKHcCCCUI3DZkbcFTjgkEDBOD3qUSyo5kR2LspV3Jy5QjaVD43cqSCpOGHBFdnrOh+FIYTN4e8YPqzIpY22q6Dc6Ley45wiG91S13Mp4Vb9wSCA2OBxQyRzjOTnGMdTwMccdOOmOp61z1Izpq0+R83wuFanWi13ThKVr+fK79z5vGYGrhHD231Kblflng8ZgcdSaXT2mDxGIUH2jUjRnbXkPQPh58WPiX8JNaHiP4Y+OPEngfWCkMNxd+HNVudO+22kEiSLZ6jbW8iwalY+ZGh/s7Ube/sGKgyWblQB+hnww/4K8/tTeDGs7Xxmngn4saTHco14/iXRo/DXiR7P7ptLLWvCP9laZbOoT5L3UvDWuXBZjJMtwSEH5Z4HoPyox34z9AfT1BGeBzjI6fXahmGMw9vY4mtHlVlF1HOn86VRThb0S02a3PouHOO+MOEnH/AFd4lzjKqUJ86wVDG1Z5fKUpKcvaZdiZYvATjOUffthKM53fNU1uf07fDn/gsb+zT4oNva+PNB+IPwxvTEjXt7d6RD4s8M205MKtBb3/AIdmk8SXg3ySGOb/AIQ+CNoYWkkMLskTfd3w1/as/Zv+LVvBP4A+NHgDW5rpnWHSLjXrbQfEhMbujGTwr4iOk+JYEYoxikn0mOOZAJIWkjKuf4mzuIwTkc8cjg5yOCB3BxwM9c0ISuSGb+8CDhjkYwMFR7/MMnJy+AAPYocS4qK5a1CjWTWsoc9GenX3XUg7+UVqfuOR/Sq46wEVDO8oyHiGmrL2sKWKyTGSSte88BPGYOc2tm8FTTb1XQ/vTfX9Cjh+0PrWkpb4z576lZrDj180zBMcH+LtXy/4z/bd+Afhnxj4b+F/hfxVb/FX4q+MdatfD3h3wT8N5E8TBdWvNQXTD/wkvibTvtHhrwrY6VN517r7anqP9r6ZotjqeqxaLfRWE0dfxuaNo2teINZsdC0DTNV1vXNXu4bHSNI0i0vdT1TVdQuw8Udlp2n6fBd3l5dMwCJbwxvIzuiokvz7P6qf+Cd37B9t+zD4buPiB8Q107WPjX4107TWuoxY2cyfDHSTaO03hHR9VEt7Ld6rcyXTL4q1azu106c2tjomlLc6fpT6zr3t5fm+JzOryYfCU6VGlKPt8RUqVKkYrRunCKp0lOrNJxXvuMLucvhSl+08BeNXGnitmccs4c4OwOQZbhKlGpn/ABNjsdic3w+XYS/N9WwWF+q5Zh8Tm2OVOeHwlGpXrRwynUzDFUPq+GhHFfp1HnvjO3nHAzxnGcnGemTU1RJ1P0/qKlr6A/puXxL5Ekff8P61JUcff8P61JTj8S9f8zUKkj7/AIf1qOpI+/4f1rSO8v8AEBJRRRVgWKcn3h+P8jTacn3h+P8AI0DW69V+ZNViq9WKcfiXr/maR+KXqhV6j6j+dT1AvUfUfzqetywpV6j6j+dJSr1H1H86AJ6cn3h+P8jTacn3h+P8jVR2l/hAtp0P1/oKanU/T+opydD9f6Cmp1P0/qKI/DL0QEtSR9/w/rUdSR9/w/rWq2XovyAkpV6j6j+dJSr1H1H86ZUN3/hZPRRRV0936fqOnu/T9SVOh+v9BT6YnQ/X+gp9alR+KXqhyfeH4/yNTVCn3h+P8jU1BZYqZPuj8f5moamT7o/H+ZrX7b/woB1Tr0H0H8qgqdeg+g/lUv4/mv0AWiiitQP5yk6n6f1FS1EnU/T+oqWv53P5vW69V+aJI+/4f1qSo4+/4f1qSgt/H81+gV/Gpq3/ACtFxf8AZQ9F/wDWOrCv7K6/jU1b/laLi/7KHov/AKx1YV9Lw1vnf/Yhx3/tp9Vw3vnX/Yhx/wD7Yf0S/t/f8FJPgz/wTn0H4Z698YvB3xO8X2nxS1XxLpGhRfDTTPCupXFjceF7TSb2+k1ZfFPi7wnHFDPHrNstobOW9d3jnE0cCrG0n5+ftMf8HGf7J3wP8QQeD/hr4A8dfHrxFb2Gm3nia40XVdB8KeEPDWoX9lb3dx4Yk8TXH/CQS6x4k0J5jYa/Ho2jXmg2OoxTWEHiC9u7e8htfln/AIOlP+Sa/sd/9jv8X/8A0xeBa/c//gnL+zJ8Lv2bP2OvgX4L8E+D9B0vUdd+FPgjxH8Rtbh0qzXV/G3jTxR4Z07WvFOr+ItRMJvdVE+q6hd2+nW2oT3MelaLDYaNZ+XYWFvEm1PC5Thcpy3McXhsRisRiquKpOjDFSoUpqjJWnOSpzlBU4WSjT1qTnecoxjZ7U8LlOFynLMxxWGxGKxGKqYqk6EMU6FKaozspzkqc5QVOFko09ak53nKMY2fgP8AwTz/AOCxf7N//BQfxDqfw48N6N4p+FHxk0vSLjX0+HvjeXS72HxJotk0S6nfeC/EulTfZdcfSBPDLqmmX2n6HrUVq8uoWem32mWWo3tl9wftWftW/Br9jH4M6/8AHT45a9caN4P0S4tNMsrHS7VNR8SeK/EmorO2keE/CekvParqev6otrdSwwzXVnY2djZ3+r6tf6do+nahqFr/ACk/tGeA/Cv7MX/Bxj+ztL8HdE03wPpfxF8e/BXXNS0Lw3aQaRo9refFq2v/AIcePRY6fZRw2tpD4ktpdW1PVIII0huL/WdRmKL9oZR+mH/BxZ+zF8bv2gf2W/hp4p+Dnh3XPHNt8FPiBq/ivx74K8NWtxqeuTeG9Y8OSaYvi+x0W0SS71hPCU0EkWoQafDc31npWv32reR/Zun6ncW2lbK8ulmWTqnOphsvzWhSxDjVqxc6F5VIToqtJJWnUhGEJz+Fzvd+4a1sry95lk6hOphsvzWhSxLjVqqU6F5TjOiq0kladSEacJz+Fz3fuHD/AAd/4OZ/2WPHvxO07wb8R/g58Svg74K1vVIdL0/4m6jrWg+K9N0kXMyw2+p+NNC0qCy1DQtJTIN/daHc+LZbHIka2ltUnuYf6RV1fSRpY146pp39hf2cdX/tr7bbf2T/AGT9lN7/AGp/aPm/Y/7O+x/6X9t877N9m/f+b5Xz1/MH+yB/wU8/4JXfth+Dv2dvhF+1x8G/hb8Ivit8Ebfw/pHw80/4neD9Hvfgta6/pmkLoCS+DPFjWz6P4b0XUFUai/hT4kWmj6FYaqmlmG/8Q6zo2lawv1F/wcN/tBa98E/+CfS+DvAd+2k3H7QPxC8O/CTUb3SpRbGH4dN4f8Q+LfFFpZT2xCrZ65beG9M8LX1vFiG88P69qlo2YJWR5xuWU6mZYLL8Pl+LyyrXqyo1PrFb6zQnBTfLXoVOVOdqMJTqJTceZwiowu26xmW06mYYPAUMBistq16rozWIrfWKM4qb5a9CpypztSjKdRKbjzOMUoNtnnP7R3/Byn+yR8JPG2p+Cvg78O/Hn7RS6HezafqXjbRdV0jwR8P765t5Ghn/AOEV1jVbbWda8R2sUqSIuqDw3p2j36iO60XUdV0+eG8f274Ef8F+P2M/jX8Ifiv8QJtK+IPgjx58HPA2qfEHxB8FtYg8OXHi/wAW+HdFELatdfC/V313T/DXi99OinSa90+/1Dw3rltaxXeoy6Ouk2k2ojf/AOCJ/wCwT8If2av2P/gz8XpPB2gav8d/jp4C8O/FfxV8RdT0u0vPEel6N490u28R+FfBnh6+uopbvw7o2jeGNQ0mLVrHTpoDq3iH+0tS1BpV+wWun8J/wXX/AGDPhD8av2Q/it+0Vong/Q/DXx8+Bfh2fx7ZePtC0610rWvFXg3TJIl8b+EfGN5YxQzeIdLk8Lz6rqekNqX2m70rV7GGKxubXTtU1211DRw4dnjoZbHDYyKWJhhv7ReK5pVKsasaUnPDezUI0ak1OmpU5RqU1KNSKajyvRwyCeNhl0cNi4pYiOH/ALQeKvKpUVVUpOeH9nyRo1JqVNShKNSmpRqRTUeV/o5+wx+238Mv2/PgpcfHT4T+G/HfhXwtbeNtd8CPpnxEsfD+n6+2q+H7HRb+7ukg8NeI/FGnHT5YtctUtpDqS3LSRXAltolWN5fzo8Hf8HEf7CPiLwf8YPF+t6P8Z/AcPwlbQrSLQvFPh7wTL4l+JGveIrvXLWw8O/DvSvD3xA1z7fqESeHtQvtTvNfuPDuh6VYCG4v9WgMqIeY/4Nq/+Uderf8AZxfxM/8AUb+Hlfi9/wAG7v7NPw0+N37afxv+IvxM8K6N40tfgX4Sk1jwfoviLT7XVdHsvHPi7xg+naX4nl069jms7u/0LSNI19dI+1QTJY6jqEGsWwi1TTNOurfaOV5ZTnxE8RDEOhlVaj7CFKtapKMpxi6bnKDUnUbUPaTX7tOU1GUlFPSOWZbTq8QSrwxDo5XUoqhGnWtUlGU1F05SlBqTqNqHtJK9NOU1GUlFP9JvCX/B0h+znqfjK30rxl+zV8XvCfgi4vUtz4v03xN4U8U6xZWksgRNRv8Awh5OhoIYUYT3kGneJNTukhWT7FDqE4igm/pX+G/xE8E/FzwJ4P8Aid8OPEWn+LfAfjzQNM8UeE/EmlvI1lq+iavbR3dldxrNHFc28hjkCXNleQW99YXSTWV9bW93BNBH+WP/AAXH+B3w3+KP/BOP9oDxF4m8KaHeeLPhP4a0jx18PvFMmmWh17wpqmieJ9D+1x6PqZi+1WlnrOhzanoOp2Ucgtbmy1GQvD9ogtZoPLP+DdHxZq3iT/gml4O0vU7mW4t/A3xY+KvhPRRK7ObfSZtatPGH2aMtkrEmp+LNTdEztQSbVwoCjmxeHy+vlazLA4erhJUsZHCV6E8RLEQkqlJzp1ITlGMlK6tJWSd3orJvkxWHwFfK45lgcPVwcqOMhhK9CeIliITVSnz06kJyjGSldWkrJO70Vot/Uvwn/wCCqfwI+MH7cnxA/YH8O+B/i3p/xX+HN948sNZ8U61pPg6H4eXkvw+CHV30zULHxtf+JJY7vzB/ZpuvDFo0mD9qS14zu/8ABQj/AIKb/BL/AIJuad8K9U+M3gv4p+MYPi5e+MLDw+nwx0zwlqUthL4Lg8OXGpPrI8VeMfCKQx3KeJrIWJsnv2doboXC24SEzfz6/sOf8rJn7U3/AGMn7TX8ravR/wDg6u/5FH9ib/sY/j1/6bPhLXXHKcE85yzBONX6visBh8RWXtZc7qVMJUrTcZ8t4R54pqKTSWl7O53xyrBvOMtwTjU9hicFh69Ve1lzOpUwtSrJxny3jHnimopNJaXsz6+/aj/4OQ/2TPgV4tfwN8Mfh746/aB17TILQ+J9T0PWNC8JeCtD1K4t4przw9b+JrpfEFxr2t6JNI9jrT6Tocvh6G+ie2sPEGovHcCD66/4J1f8Fi/2bP8AgolrWsfD7wnpHin4VfGTQtHm8QzfDfxzJpd1/b+g2s0EOo6r4K8SaTcPZ6/FpEl1aDVbC9stD1uCKc3tvpN3plteX9v9Hf8ABPv9l74V/sxfsi/BP4c+BvBnh/Sbm++FvgzVfiFrEGk2Sat468Z694csNT8V694nv/JN3q8+oaveXotob+a4h0zS1s9FsFg0ywtLaL+YX4xeA/Cv7Ln/AAcofBGH4N6Jp3gfQvH3jv4XaveeHPDlpBpOiWM/xf8ABV74K8exWGnWccVta2viCW91nW7y0ijW3GoaveNBHDEYoopoYbKMdHHYTDYbE0cRhMNicRQxlTEup7d4VyclVoKEadONRRbjGLk4xcbyc0+aaOGynGrG4XD4fEUq+Fw2Jr0cXPE+09u8M5OSqUOSMKcaii3GMW3GLV5cyd/7W0+8Px/ka4L4t/EEfCf4X/ED4nv4U8U+OYfh94R17xldeEPBFtpt74w8QWPhzTrjVb/TvDVjq+qaLp+oa1NZ2s50/T59TtGv7hUs7eRrmaGN+9T7w/H+RqYgEEEZB4IPQj0NfORaSTlHmipxco3ceaKabjzLWPMk1zLVXuk2kn8/FpJOUeaKnFyjdx5oppuPMtY8yTV1qr3V2rP86P8Agnp/wU8/Z7/4KQ6T8Sb/AOC2k+P/AAnq3ws1HQrTxN4U+Jmn+GtL8Qtp3iW2vZtF8Q6dD4Y8VeK7G60a7udK1bTXla+hurW+090urSKG6sJrr7F+PHxq8C/s5fBr4l/HX4l3s1h4G+FnhDWPGHiGS0WCXUbq20q2aSDSNHt7m4tLe713Xb42ui6FYy3Vsl/rF/Y2Zni8/wAxf46L60P/AARS/wCC4dhqUIPhz9k79py4lGV/0bw/o/ws+LeuJHf2jEf6HZw/BD4p2FvfJEPtOqQ+ANIst3lt4lzJ9b/8HJf7UHiPxMPgN/wTj+Dn2vXvHnxm8S+GPG3j3w/osgkv9Wt7rXz4c+DngFo1cxTS+KfGwvPEk9jcGC4trjwx4QvgTaakrN9HUyajWzHAU8G5rLsfShi4VJz5pUcPTgpYyM6jSXPRcJRvK1nUjfSOv0csopVcfgoYRzWX46lDFwnOXNKlQhFSxcZ1Gl71JwlG7tZzjfSOv7V/sE/8FI/hN/wUG+H3xJ+K3w1+HnxY+Gvw6+GWtW/h7VfF3xisfBHh/RtW1VNHfX9dg0e78OeOfFcfleEtHl0m/wDEl1qraXa2cGvaW0Et1m++xfmf+0V/wcyfsifCzxtqXgf4J/DT4jftJSaPfTaddeMdDv8ASvA/gHVLqCRopR4U1XVbbWvEPiC2jlSRF1L/AIRTT9LvkCXWj32qWE0N2/kH/BUfwe3/AATD/wCCIPwy/ZQ+GeoLaa18SPFfg74O/ErxPo5ktbnxJqHijR/FnxP+Mutpc4jum03xZq/ha48KC1umlmTwTrUPh6QvZW+F+Q/+CUX/AAU7/wCCU3/BP39nfwxouteC/itfftI+JLW51T4zfEzTPhR4f1bUb7Vb28nktfCnh/xJeeLbbU4PBvhvS/sOm2enWqWNjqGoQ6hr1xZC/wBVuGrpoZXg6tHEZhRwGMx+HeKqYbAYKjWlFunSsp4nE17KooykrwjFL40rNrTpoZbhKlLEY6jgsVjaDxU8PgsJSqyi3TpWU8RiK1lPllL4YxSfvJa62/ZH9hv/AIL8fsh/tk/ELRPg5rei+L/2ffiv4pvItM8H6P8AEK50fUvB/jHWrlxHZ+HNA8caTNFHF4kvZQYdP0vxJonh2PVruS10vRLzVNYvLfTn/dGv8/r/AILMft1f8E6v23dK+H3xX/Zh8L/EfwR+1J4T8Y2y+IPF+ofD7SPA0PjLwJLp9/O0uva1ofiS+vNQ8WeF/EVpoF14X1a5ga9tdOutbsze7PsCW39p37BPxp1n9on9i/8AZi+NXiWb7V4q8f8AwZ8D6t4uvNqot94wt9Hg0vxZfpGgCxR3/iKw1O8ihAxDHOsWTsyeTNcthhsPhcZSw2IwUa8qlGrg8TLnnQq00pJwqaOdKrC7i5apxa7pc+Y5fDDUMPi6WHr4SNec6VXCYiXPOjVguZOFTedKpC7i5apxa7pfXKfeH4/yNfEX7cn/AAUO/Zo/4J8+AtP8afH3xPfrqniR7yDwN8N/CNlb638RPHdzp6xPfjQdGuL7TbK203ThPbjUvEGv6po3h+xlubSzm1P+0r/T7G7+3U+8Px/ka/h60X4c2v8AwVv/AOC/3xo8J/Gya8174Kfs7658RrG58GG7uYbK++GH7Ovii0+G+keFLKSGVJ7DRfG/xK1m08TeKFgkhuru18S+I4bWewury2ntOfKcHSxVXEVcTKccLgsPLE4j2dvaTipKEKUG9IyqTajzdFtq7rDLsJSxM69TEynHC4ShLEV/Z29pOKajCnBu6TqTaXNbRbWbuvvLwN/wdSfs1at40t9J8d/s1fGHwV4Hur1LY+M9K8S+FfGOqWEEsnlrqGp+EFh8PlbWAMs99FpXiDV76OBZfsNpqNwsVvN8Pftw/Fn4cfHX/gvZ/wAE4/i38I/F2keO/hz471D9i3W/C3irQ5nlsNTsJPjZrcMgKTRw3dlfWN3Dcafqulahb2mqaPqlpeaXqlnZ6hZ3NtF/Zp/wpj4PyfDw/CKT4V/Dl/hSNMGjD4aP4J8Nt4BGkeUYP7MHhA6adAFj5P7r7KNP8nZ8uzFfwufHj9jfwf8AsRf8F+P2Tfhh8NIZtO+FfjH9oT9mL4tfDTw7Pc3F4PCPhzxh8Wrey1LwraXN1LNPJpWj+M9A8VxaIJpJLiLRX0+G8nvL2O5vrn3MqqZbWxGMeFw1bB1oZdjkoTr/AFinXpvDzTd5RjKlVhaMmk5QnFyS5ZRV/Xyypl9WtipYbD1cJVjgMalCdf28K1N0Jpu8oxlTqQtGTScoTi2lZxV/7ofjN8afhX+z18N/E3xd+NPjjQvh38OfB9mL3X/FHiC4aGztlkkWG1tLW3gjnv8AVdW1G6kistI0TSbS91fWNQmgsNMsbu8nigf+bv4m/wDB1L+zJ4e8UXOlfCz9nH4v/Erw3aXT2/8AwlfiDxF4Y+HP9oxxOUa+0nQvs3jG/eynA820GsSaHqDxMn2zT7GYvCny5/wXg8XfEb9sn/gpT+yn/wAE1PCviOfw94GS8+HDauv7ySwT4g/FvVbqLU/G2q6fHLDHq8fgX4aCyuNDt5T9ptm1HxXBZyx/21KG/p//AGcf2Cf2Sv2V/hppXwu+EfwQ8A6fpFlpkFhrWva34Y0PX/Gnje6WFYrzWfHHinUdOl1PxFqWpSB5p0uZE0yzWQWGj6dpmk29pp9vwRw2XYDDYXEY+lWxeJx0ZVqOHp1vYU6OHUnCM6k0nKU5tNxitFppZNvkhQwODweHrY2lVxVbFU3Vp0KdX2MKdDmcYznNJylObTaitEvmz5M/YH/4LS/sc/t+a9D8OvBup+IvhX8aprae5s/hR8U7fTNN1PxNHZQPdahJ4D1/StS1PQPFn2K2jluptLW60zxT9ht73Uv+EbGmWN3ew/qT468e+C/hb4L8UfEX4i+J9G8GeBvBmjXviDxT4p8Q30OnaNoejadC093fX95OypHHGi7UQbpp5mjt7eOWeWON/wCPH/g4M/4J6fDX9lS3+E//AAUB/ZK0a0+Bniey+LOg+HPHWh/DmGLwzotj4wntdT8VeBPip4R0rTFtbDwnrVhqvhe50zxBFosUFlqt9f8Ah/V49OttSi1/UNW47/guJ+3v47/aA/YB/wCCb3hbR5pNMk/az8EQfGn4x6TpBa0tdV8S+CNP8JaHYeGYo42UXXh0/EXXvFWsQ6fcYiW98NeF75ozc2kTQbxyjDYypga2Xzq08Ljq1WlVhWanVwlTDxdStHmSSqRdNN02+rjduN7arK6GLqYCtgpVKeGxc6lKpCq1Ophp0YOpVjzKyqRdNP2bfVq7avb6q/aT/wCDlT9hLxJ4hl8E2H7IPiP9p/4faPqUqw+JfiXp3gXRNDv5In8t9a8L+EvGGheMdSa0uIkWS0l1+z8Kau8eFvNNsWXbX2z4B/4L0/8ABPbTf2Qda+PPw/8ACXjfRNH+F/iDwl4U8Xfs5eE/CfgTQPiN4Mfxpe3VppWt6X4dbxToPgrVvBM9/bTxtr/h7X5hbzS21vqun6Zql5Fp5+/f+Cf/AOwJ8FP2CvgN4L+GvgHwf4cHj5fDmlt8Vvicul2cniz4heNZ7OKXxFqGoa9JAdUOgJqj3cPhrw8bk6boejLbWlvC05u7u6/B3/g5S/YC+D2mfAbT/wBtb4W+D9D+H/xH8PeOPDvgz4vt4U0610HTfiR4O8ZXEttpes+JrDTYoLTUfFfh3xfbeH4LXWJYBfajpeqXEOr3d6NE8PJYVQWS4vF0cDChjKVJ11CniHi5TVd3a/eUHFRpKtyvlqU7Tg5Q5k05JaUf7JxOJpYOFHFU6brKEKzxMpqs7te/RcVGmqtmozp2nBuPMmnJL+lr9lb9o3wd+1x+z78Mv2jfh/o/ibQPB3xU0W613QtH8Y22l2niaxtbTWdT0SSLV7bRNW13S4rhrrSp5UWz1a9jMEkLNKsheNPxj/bF/wCDkH9jj9mjx/rfwt+GfhXxj+0z4s8LX9zpXibWfA+qaL4c+GenarZyvb3uk2HjnUxqlx4jvrG4R4rm68P+G9R8OlgUtfEF1Mk8MPy7qv7Rfir9mn/g2L+FvirwJqV1ovjXx38Obb4P+H9bspnt7zRk+I3xZ8V6T4n1CyuYWS4tNRj8ER+J49JvrWWG607VZbLULeVJbVM+3f8ABux/wT6+Dfw1/ZG8DfteeK/Bfh/xT8d/jpceIde0XxTr+l2eq3/w68BaP4j1Xwx4e0LwfJexTpol1ri6JceKNb1jTBbanqKazYaRd3D2mjW0QmGBwWGjjcZi4VatGlj6uCwmGhVcJVJ05zblVq8rkoU4KKdknJ3b1aREcJhMPDF4rEwqVaNPGVcJhsPCo4OpKEpNyqVbOSjCCSdldu7etkex/sk/8HDH7G37TmmeN9P1zQPHXwY+KHgvwH40+INp8OvFcuganH8RNN8C+GtT8Va1onw18X29/puk6v4uGlaTdva+HfElv4Ru9QfB0ttQhg1CWx+6f+CeH/BSb4Mf8FKPA3xB8ffBfwd8T/B2k/DjxXp/hDWbX4n6Z4U0zUbzUdR0iPWobjTI/Cni/wAX20tkltIscr3V1aTicFVt3jxIfE/+Cv3/AAT++Dn7X/7Jvxi8TXngzQdO+Pfwr+H3in4jfCj4p6Zplpp/jO017wRot54jj8J3+v2sUWoaj4W8Ww6bLoGoaZqM15ZWEt/b6/ZWqavpVjcR/mB/wahf8m2/tU/9lw8L/wDqBWtOph8vrZdicdh6dalVo18PT9jOs6kaXtJSUnGXLF1YVI6x50p05RlG8k01M6GArZficZh6dalUpVaFP2M6vtI0udu7jLlj7SFSOsedKVOUZL3k0z7vj/4OBv2GdO+Lf7THwl8d6f8AFz4a3v7Ltv8AEceLfE3ivQPB8ug+NNZ+HHxN0T4Uz+FfhraeHvHWt+KPEXiTxP4i123u/DdjeeHtIh/sKz1TWdfutCstMvZIPg63/wCDr39nF/GQsLr9lX412/w+N75a+KYvFnge48Xf2eZSv2xvAzNb6OLkRjebFPiC8e/dEL5sCQ/m1/wTi/Zn+G/7TX/Bff8Aaw034reGNK8a+EfhH8X/ANr740P4T8QWUGp+Htb1vQPjpL4R8OLrmmXUclrqVjpWueOLDxBHY3SSWdzf6RZR3sNzZtPazf1p/wDBUH4A/C340/8ABP8A/al8MeNfBnhzVI/B37P/AMU/G3gK7uNIsWuvBXjHwD4H1nxT4R1vw3ciAXOjS6frGjWKXC6ZLafbtKa90e5L6ffXMEnTXoZTg8Th8PUw2IrvEUcHOcvrLgqDxEKacoJQvUk5TdRqTUYxShBPVvqq0MrwmJoYeWHr1ZV6OGnOX1hxVH28YJuEVC825Tc2pNRikoxT1b+r/wBn34/fCn9qL4PeB/jt8FPFFv4w+G3xB0ttT0DWIYprW4Rre5n0/VNJ1XT7lY7vS9c0PVbS90jWtLu40uLDUrK5t3DBFdvhzVv+Cs/wB0X/AIKMWn/BM+58B/GCT413WoaNp8fjODSPBbfC1Zta+Edp8ZbZ31OTxzH4sEcfhu7j06cjwezLravBGklgF1BvzE/4NVPF+sar+xZ8dvB99dTXOl+EP2kL+90SOaRpBYQ+KPh14Hmv7K2DE+TaG+0mXUBAmI/tmoXtxt8y4lZvjHx3/wAraWjf9jP4A/8AWD9ErnpZZQhjc1ws3OcMHhsVWoy5uWXNTjTnSc+VWlaNS0o2Sk1fS9ljDAUo47MsPNylHC4XEVaT5uV80FCVNysvesp2ktFJq+l7H9Mn/BQr/goX8If+Cbnwj8JfGX4zeE/iR4w8OeMfiPp/wy07Tvhjp3hjU9bt9b1Lwz4p8VQ3t7B4q8V+EbBNKSw8JahBLLBqFxdi7uLNEs3heeeD8uv2jP8Ag5g/Yy+Deh/Dxvh34D+JPxt8a+Ofh34H+I+q+E9Lu/DPhjTfhxa+PPC+l+LdO8IeOfFpvvElj/wnumaZrFmmv6J4SsfFWmaLfLd6ZqOvW2p2c1kOA/4Osf8AkxD4F/8AZ2/hX/1Tnxrr9AP+CI/7LXwr/Z8/4J4fs3a/4U8H6DaeOvjX8LfDPxe+I/jYaXZ/8JR4r1H4kWEfizT7PVdZMP22fSvD2h6rpmg6NpYlXT7S0sPtCW5vr3ULu7KVDAUctw+OxNGtXq1MTXo+yhXdKE1BRacmoScFCLbfJ705SSbjFNt06OCpYCji69KrWqTxFal7ONZ04TUFFpyfLJxUE2/c1m2k2knfzf8A4J0f8F5P2XP+CgPxHt/gdH4U8Y/Az41arZahqHhTwn41vtH1vw946j0q0n1LU9N8JeLtJa1Nz4h0/TLW81W40XWdB0OW4021uLjSZ9Ue2vIbX9ya/hs/4LGfDvwd+zB/wXC/Ya+KnwZ8PaT4D1Lx/qn7O3xM8WWPhmxt9G0/V/G2n/H3XPCut6zNZafHb2iv4p8M6Po+n+IUSBRrE0eo32om5utVvpJf7k6wzLDYelHB4nCxnTo43DuqqVSftJUpwqOnOKm0nKN1dN6/J2WWPoUKccLXw8ZwpYui6ipzlzunOM3CUVOyco6XV9fk7Kdeg+g/lX8Rv7Uet6N4a/4Omfh94j8Ratpug+H9A1T4S63ruuaxe22m6Ro2j6V+zJb32p6rqmo3kkNpYadp1lBPd317dTRW1rbQyzzyJFGzD+3Jeg+g/lX8C/8AwU8/Zw/4a7/4OK7b9nCXVL3RNK+KmpfATRPFGqaY4j1Oz8EWPwQ8Na948k0x2SSJdSbwZpGux2H2iOW1N28IuopLYyo2+RKDr4xVJckHluLU5pczjBqHNJLq1G7S6uy6m2TKLrYpTlyweAxClK1+WL5OaVurSu0ursup+sHx7/4On/2SPhz491Lwl8Gfgt8T/j54f0W/m0+8+Iiazo/w38Maw0Epje+8IWesafrviLVtLfH+j3Wu6P4UluWDNDatatBdz/qB/wAE7f8Agr9+yV/wUfj1Lw78K9S8QeBPi/4f01tY174M/Ei307TfFraPFJFBdeIPC17peoanonjDw9a3U0cF1c6XfJrGliW1m1/QtGiv7Brn7j+E37O3wM+Bfwx074M/CX4VeB/A/wAMdN0uLSF8H6N4f0+PS9RtUgEEs3iBZoZp/Eup36hpdW1jxBNqWq6xdSz3mqXl3dTzTP8AxV/8FrfgF4b/AOCT3/BQr9kv9t39kvRbP4Z6V8Q9Z1rxzcfD7wrGmj+GbLxv8LdZ8NQfEfSNI02yWCy0XwZ8TvBfjzS9I1XwvZwxaarXfitbOODT9QisLHehRy3MG8JQoV8NiHCcsNWnX9qq06cXPkrU+SMYOoou3s9I30b5fe3o0sDjHLDUaNahXcJuhVnW9oqsoRcuWrDljGHOk/guo9G7e9/XP+33+3f8K/8Agnb8C7X4/wDxg8L/ABA8W+Errx34f+H8elfDWw8Oal4iXV/Een65qNndvb+KPE3hPTBp0MOgXaXMi6o1ysstuIrWZGleL279mX4/+Ev2qPgF8Kv2iPAmleItD8H/ABc8J2XjDw/pHi230y08S2GnX0k0cVvrNto2qa3pcN6jQOZEstWv4ACpWdiSB+FH/BztqNprH/BMDwtq9hIZbHVP2ivhDqNnKVKmS0vvB/xFubeQqeVLwyoxU8jOD0r9Hv8Agjh/yi8/Yk/7Ib4e/wDSrUa4q2GpRyuhi0pe3njK1CTcny8kKaklyWspKV7yvd7WOaVCmsBSxFpe1liqtKT5ny8kIJpctrJ3vd3u9j4/8Kf8HF37CGuWX7Rmp+I9B+Nvw8sv2boAmtN4u8O+Bmu/iH4iuPFVz4R0nwZ8MdP8PfEPXL3XPE2sahZ3d7bQavDoGm2Wh2eoa5rWp6XpemaldWkf/BOX/gvb8P8A/gov+0pc/s6eCv2X/iz4JkHhfxL4yg8d3fiXwr4m0TR/DvhpLcSal47sbWPR7rwzb6lf32leH9PbR5/FxfxFrekWMqxWVxc6nafzuf8ABCX9kz4WftPf8FTP2idZ+MvhTR/Hvg34FR/E34j6T4N8SWNvrHhnVfiDe/FO28LeFb7X9Dv459M1mz0HT9W8TatZWd/bzwxa7b6Re7G+yFW/vl0L4ZfDbwvrs3ijwz8PvBHh3xNcaND4cuPEWheFNB0jXLjw9b3K3tvoU+rafYW9/Lo8F4q3cOmSXDWUVyBPHAsvzV15nRy3AzqYaGHrVa0qFOdOpLENQoSnCLXuqPNV15py5mkrxglZSb6cbTwOElOjGjVqVZUac4zlWahRlOEWrR5b1PtSlzNJXjFKybP4y/8Ag3e/5S4/8FGv+xX+Nf8A60z4Yr+h3/goL/wVz/Z9/wCCb/jz4PfDz4y+AfjH4w1j412Oq6j4Zu/hlpHgnUtN02HSdZ0rQ7hNdk8VeO/CV1BJJdatbywjT7TUVMEczO0cipHJ/PF/wbvf8pcf+CjX/Yr/ABr/APWmfDFO/wCDqf8A5Od/YD/7Fnxr/wCrB8FV34nDUsZndOhXUnTlg6MmoycJXhg3ONpJNr3kr6arQ6q1Cnic2hSqpuDwlKTUZOLvDC80dUm91r32P6a/+CsX/KND9uj/ALNi+Ln/AKiWoV+T3/BqX/yjl+Kf/Z4nxI/9VB8A6/WH/grF/wAo0P26P+zYvi5/6iWoV/nqfAf/AIKifGH4Bf8ABPvxP+wN8DLxvhrq/wAa/j34x8bfFD42Pqjade2Hw/8AGHgn4X+CLfwZ4ZvLQPeeHBfzeEtYuvGvilF+3weH5rbTdEWOS71G5j5crwtTG5VicPSspSzDDSlKT92EI0puc3bV8qd1GKcpNpLe6xwOGqYrL69GnZOWMw7cntGEacnKT6vlXRXbbSW91/b14v8A+C8X7KVt+1wv7F3wU+GX7QX7VXxcbxBF4RS9/Z98O/DvXvBE3imHzjr+lweJvFvxM8HRS2Pg6O3nm8XeKvsy+D9EgtNRuZtfa00y/uIPwe/4OnP2zvh58R/GXw4/Yv03wv440z4n/ADxVY/ETxlrmq2vh4eCb/TPiV8M9G1TSdO8PajYeIr7WrzU9Pi1WGHVRf6Bplkk0U32K8vYhHJJ/Qj/AMEhP+CVXwN/4J3fBjTPEWg6n4c+LPx5+KnhnSNT+IPx50sQ3+lapo+pwWusWHhP4V3pDtZfDCEta3tvfQNHfeO7qK18S64Ugi8P6H4c/Hz/AIO0Ph38P9J+FH7MvxH0rwL4O0z4h+LPi14m0nxT480/wxoll4z8S6Vo/gG1h0nTNf8AFFtYx65rOn6XDBDFp1nqN9c21lHDEltHEsaAaZe8DHNsNTw9OtOMOenGtOo06ldRles6TilClaNSMaa9580ZSa5VEvBvCRzHDQowqTjHnhGrKbTnVUZXquDilGnZTUYLV8yk2rJH6a/8EcP+Ctv7Pv7bPhvwh+yz8NPAvxh8M+Of2ef2Z/h9c+MNe8e6R4J0/wAIapF4KsPBnw61Q+HbzQPHfiPWJzPrF7HeWX9qaLpSvpiSS3DW10FtG8V/a4/4Obv2K/2fPiBrHww+D/gvx5+1L4i8O6lPpGs+JfAuo6J4Z+F51S2na1udO8P+NNU/tXUfFUtvdRvC2paF4Uu/DN6PLm0bxDqsMm9eG/b7u/hp+xX/AMELNO+KPwD+FXwx+E3xh+PH7On7OHwS1X4kfD34f+EvB3jLU9N+K3hrwhd/EFtX8S+HdI07XNTn1rwvp3ifdcXWoSTJrd3ba15jX1pHIfyP/wCCLv8AwUo/4JRf8E7PgXBqvxV8D/FTXv2u/GWra/efED4i6R8KPD3iY+G/D6areWHhXwR4C8Tal4s0+/03QG8PW9jrfiEWNlps+reJNWv4NTl1Kx0bQfsdU8Dhq6xONp4PFV6aruhRwkKyc5VIubr1qlZRTjS5muWMVdXtrpbSGFo1VWxMMNXqwVV0qeHjUvKU05OrUnUSTVO7XLFK6va70P3O/Yo/4OUv2MP2pviVoHwe+JPhLxx+zB488V6nb6H4WvviBqGieIPhtq2vXky2lj4fufHWlnTrnw7q9/dutvZyeJfDGkaBJOUtZNehvp7W0n9o/wCDjz/lEP8AtJf9jD8CP/V8fDmv5rf+C2n/AAUe/wCCWf8AwUS+DuleI/gr4I+J/h/9rbwV4k0Obw/4+1v4WeH/AAqPF/gi4kbT/E3gzxt4i0zxVqV5qlhZWtxF4i8NSajZX9zpOqaQ9hpdxp1n4g1pbz9H/wBqz4/eKP2mv+DVbw38W/G2o3OseMb3w/8ABnwT4l1i+le41LWtW+E37VPh/wCFE2u6pcyM0l1qmvR+C4tb1G7kYyXd5qE1y/zSkBvARo18txdPD1sIp46lRq4avLncJqalCdOb1lTnFSVpaqUfUr6pGnVwWIhRq4fmxUKdShVlzOMk+aMoT3cJJNa6pr5H6of8G7X/ACh3/ZF/66fH/wD9ae+NFeufspf8Fef2ev2u/wBs747/ALDvw98A/GXQPif+z5F8VZfF3ibxlo/giz8B6svwh+J2hfCrxCPDl9onjzXvENwdQ17xBaX2jDU/DelCbSIrmW+NheLFZS+R/wDBu1/yh3/ZF/66fH//ANae+NFfhv8A8EQ/+Vhb/gpr/wBef7b3/rZPw0rmnhqVetn1SopOeGdarStJxSm8U4NyST5lyt6OyvqYSo06tXNZzTcqHtKlO0mkpOu46pL3lZ7O3c/ro/ax/a7+AP7Evwe1j44/tGeO7PwP4H0u4i0yxXyZtR8Q+K/Ed3DcTab4U8HeH7MPqHiDxFqSWtzLDZWkYhs7K1vdX1a607RNO1HUrT+WHx5/wc7f8E/fiR8StP1Hx9/wTp8QfEfwzpF1HBpnxE8d6b8FvEfxH0zTYpy0VxpvhXW9M1exs7iMM00VhB8S4IVmYqL5dxlrxL/gsjF4p/4KLf8ABdb9nf8A4J0ah4k1TRfhX8OpPhv4S1Kx0+YA2R8e+ErD43/F7xnpsUyy2/8AwlF38MZdF0TTZbiKS1hk8M6buiCTXxn/ALOPg7+zf8B/gJ8L9N+Cvwh+E3gXwL8LtM0qLSF8HaL4e09NL1K1jhWCafxF58M1x4n1TUAGm1jWfEM2p6trN3LPe6pe3d3cTTOlSweAw+GqYmlWxGJxdL2yhTryw8KFCTcYe9BOUpzWtn7vRqy1pQw+Fw9GVaFStVr0/acsKsqMadKTaj70VzOUlr26Wtv+PXxt/wCDi3/gnz8D/g/+z38X/D2n/Fn4veA/jzb+PrDw/afCbw34JTWfhzrXwrXwRF4m8E/Ejw54z8eeCrrwr4hsY/HWhPYadZJqlle6YU1fTr2fQr7RNR1P9bf2qP2lvBX7JH7OXxP/AGmviDo3ijXvBPwp8MweKde0Xwda6TeeKr6xuNS07S0g0i11vWNC0ma7E+pwOyXus2MIiSVhMzhEf+DL/g5i/YB+FP7H37RHwf8Aiv8AArw3pvgD4bftM6N491LUvht4dto9P8JeF/if8P7zwnD4v1XwtolqsWneHNI8XaN4v8IXR0PTraGyt9X0rWZ7JYbGe2sLD+vP/gtn/wAokv2zP+yPaZ/6l3hKnWweD5cqnQ9q4Y2tONX2k/fUfbUoez0XLGdNTnBzjpNqM7JuxU8Ph+XAzpe0ccTUanzy95R9pCPLorKUVKUXJfE0pWV7L6U/YD/br+Fv/BRP9n+3/aM+D/hjx/4R8HXPjDxL4KTSPiVYeHdO8Srqfhc2Ivrlrbwv4l8V6X9hn/tCH7JINWNw+yTzraHC7/tev50v+DXP/lFnpX/Zffi//wCheGq/otrzsdShQxmJo001TpVpwgm3JqK5bXk7NvV6tHLiIRpV61OF1GFSUY3d3ZWtd9d9zA8W+JrHwV4R8V+MtThurnTfCXhzW/E2oW9ikMl9cWOg6Zdardw2aXE1tA91LBaSJbpPcQQtMyCSaJCzr+dn/BNH/gqz8Bv+Co2j/FvXPgb4F+Lngm1+DeqeD9J8RxfFfSfBul3Go3HjW08RXmmyaIvhDxt4zjmhto/Dd6t8b6TT3R5rUW6XCtK0P238e/8AkhHxs/7JJ8R//UO1qv5L/wDgz4/5J9+3X/2OfwD/APTH8Vq3w2GpVMBjcTJS9rh6mFjTak1FKrO0+aNrSutrtWN6VKEsJiKrvz03TUbOytNyUrq2u2muh/Tz+2d+3Z+zH+wJ8Lx8Vv2mfiLaeDdHv7i40/wp4dsraXW/HPj3WraFJpdG8FeFLEnUNYuYVltzqF+4tNB0NLq1ufEGsaTZzx3Dfzfaz/wd8/s6weJ3tPD/AOx78adU8GC5KJr+sePvA+heJntA+BO3hGzs/EOlpcGP5/so8atGG+T7Xj56+GLn4ez/APBcL/g4P+MXwy+NWs6xefs3fssaj8StKk8F2OpXdhBP8JP2ffGenfDl/D+i3NrLFcaUvxX+KuuWOv8AirU7SW313+w/EOqwabfafc6do0mmf236N+y3+zT4f+G8Pwe0b9n74L2Hwpg04aSvw5h+GPgw+C5dOEXkPa3XhyTRn0q9SaPIunvLWeS7dnluXllkd27pUsDgY0YYqjVxWIq0oVqkY1vY06EKq5oRVotzqcrTbb5V5KyNlTw2GjCNaE61acIVJqM/ZwpxmrxirJuUrau+nyPMv2MP24/hD+3N+y/ov7Vvwh0vxrpfgPVR4qt5tC8baTpmk+LtL1TwXc3Nlr2mXVrpmta1o0zx3Nq4srux1q6s7uGSGQzQuZYofnn/AIJmf8Fcf2fv+Cp4+Nh+BXgL4x+B/wDhRR+G48U/8La0jwTpX9qf8LO/4Tz+w/8AhH/+EO8d+NftH2L/AIV7q/8Aav8AaP8AZnlfa9N+yfbfMuvsn1N8If2Xvgv+yJ8BfHvwm+AXhUeB/hvc3fxM8daf4Pt724vNJ8O6p41iu9X1zT/Dy3bS3On6B/ab3F1pukPcXFvpMdw2n6cbbS7exsbT+UD/AIM5en/BRb6/sjfy/adrClQw1TDZniKcaiVCpQ+rKc9Ywq1OVqokrTkldXutVdbhGnSnRxVWKklTlT9leWqjOdmpJK0nbS+nc/e79qf/AILUfsrfsfftofD39ib4v+GvirY+M/iBZ+ANT/4WdaWfw/tvg94P0X4gaxqOk2+ueM/EOvfEHRNe0rSPDq6Veap4mvbfwxfR2GlxNcW3211eJfy0+M3/AAdu/sleCfH+o+GPg/8As7/F340+C9K1CWwf4kXfiDQfhpZa4kEzxtqvhbw3qumeINdutJuUXzrBvE0fhHVZoz/pek2DfLX5jf8ABd/4PaX+0J/wX7/Zd+BGuyXMWgfGPTP2Rfhl4hns5Ghu7fw942+K2u+HdeubWVCHiuLbSNQvZ4ZEIZJI1ZSCBX91Oh/s/wDwN8O/CW3+A+i/CH4b2HwWt9BHhhPhZF4N0BvAcmgC1+xNpl14ZlsZNKvbee2BS6+2W08l4zSS3TzSySSN0zpZfhaGBq1aFavUxOH9pOCrunCNpuLmmouXM/hjBNQVnJtt2WkoYajTw85051JVaXPKKqOEV7zTkrRbu9lHSKtdtt6fLX/BOf8A4KYfs2f8FM/hVrXxJ+AV/r2mat4M1DT9F+JXwy8b2dlpvjvwBq2qW9zc6S2qWum6hqumahoOvxWWoS+HPEekajd6fqi6dqNpL9h1nStX0nTv0Nr+En/g3x0W3/Z+/wCC5f8AwUU/Zl8ESXNr8MfC2i/tR+BNM0VrmaaJbX4LftQeEfDPge9uHmd5Lq60nQJ9Z06GednlKaxduzlpGLf3bVhmGHp4atKnScnSlSpVqfM7yUK0I1FFvS7je197Wvqm3hiqUaNZxhfklCFSN3dqNSKkk31t3Jk+6Px/madTU+6Px/madXItl6L8jnCpU6H6/wBBUVSp0P1/oKZutl6L8kPpV6j6j+dJSr1H1H86Bk9f54v/AAda/sPXfwf/AGtfCP7ZPhDw9cw/Dj9qDw/Y6L481a3SabTdL+PHw/0tdJuorvy7WOy0MeNvhxp3hPVNGtWuJbrX9a8MfEjWmUtbXRP+h1Xwh/wU3/Ym0j/goP8AsVfGf9mS6uNF0rxT4p0i01/4W+KdcthLZ+Evir4QvYde8FatPeRWGp6jpOl6jfWknhTxZqOi2U+sjwR4k8T2VjDcPetbTd+W4n6ri6c27U5/uqvbkk173/bkkp+ikdGFq+xrRk/hl7k/8Mra/wDbrs/S5/nE/wDBCf8A4KJXH/BN/wD4KA/Dj4o63OB8IfidCvwU+OltKjSJD8PPGmr6Q58TxxqysbrwVr9ho/ihWUlpLLTdRsiNt85H+wEJ4spJHcLNbyoj288MivFNFKnmQyxSKWR0mhKyxMpIZGypIG4/4T3j7wP4p+FXjnxf8OfG+kXGgeM/APirxJ4J8XeH70hbvRfE/hTVL3w/4g0m6MLlGuNM1mxvbKZoWMbPbuquyNz/AKr/APwbcf8ABQi+/b3/AOCdXhnTPiDqaav8b/2WNU074G/ES9vLia61jxJ4b0/Q7W4+GHjO8aSQyyPrfhlJdA1C6uS81/4j8Hard+cwuPKX7k+gP6EknG0cEg5x2PA5OSV/Hr7GviH9u39sjw7+x98K/wDhIAkOs/E3xamp6Z8L/DM0c81lqGsWcSNd6zrf2do3h8PaKlzbXN+q3NvJeySx6bBIWmOPsZLaDPmKishyQhYGI+u9CwJxx37Yzkcfyv8A/BaPxNqup/tV6N4YnSWLQ/Cfwq8LyaFCXl8kN4gvtYvNUu0jkzCbh54YoZZIsO5tIt+7y1VPE4hzGrlmV169DStKdOhSm0mqcqrn+8s01JwjGVk9209UrH5D448a5jwF4eZpnWTv2ebYnE4LJcuxLiqiwNfNKlalUx6hKMouphsLRxDwzmpQhi6mHqTjONJwn8Sa14k/aG/bn+OGj2mqX+p/Ez4n+MrmPRPDOmB4tL0nR7OD7Reix0i0iK6R4X8PaRYw3V/dvFHKY47ZppnvLvdNN+4fws/4IrfCmx8O2DfFTW/HvjHxdc2No+uRaX4i0rwb4Q03UXAluoNNtrXTtV8QarBaSM8dpdajdWLyxAyyafCZBEPwq/ZY/aC8QfswfGDSPi94V8MaL4w17TdG1/Q9O0XXHvY7Az+ItPfTlu1bTgl80sIkZxFbzWr3CvJam5hjnZq/RO3+LP8AwVk/bX1B08CHxx4H8JXatKp8LWa/B/wpDZzyYELeLdTaw1nUreOGQgCPW72W5jxPHFPxOv59k1TLKrr18fg8bneaV68nHDqg8RCNNxk4VJTqSVNOc3NcrnHkUI2jazX8X+FGN4ExNLNs24t4S4s8VfEDNMxq+xyjDZZjs0oRwNOFN08bjMVUxcMLVxWMxNbESqVcVOq8Ph6VCnSw1OnGPLz/APwUL/4Jy+Av2WPCWmfEL4c/EqK5S41OystY+HHivWNNfxWkOpSNbQav4WxFpmqa3p1pcqqatHJpj3Nosn28PJaxzpB+XXw1+JHi/wCEHjbw98RPAesT+HvFPhu9Fzp1/bGLYYWeNb3TL63kbyrvStQtxLa6lYzMkc0EjLIDtR4/2dsf+COXxLl0vXvib+0/+0b4Y8MaJ4f0rUvE3irUdIt/EnxG8Q2Oh6TY3OpapdTa1rs2kWyTQpHPI6xR620nls0K3M5WN8XwJ4//AOCOXwJjjaHwn8TP2lfEVuHY654q8JifS7qZSSkyaB4i1XwRoFuuV8uET6NNku22aQkuHjsrn9cp4uUMHwzRcY1KEMVjWqznTaftqNGl7apG0lDmhGSgmnG93ZPijw7x9Tiiln1bBcNeAeArxoYvLct4i4rf9o0a2DqRhUx+W5Zl0MdmlOo67w86lDDy+q06ynTpThCtVpr+hf4D/Fbwb8X/AISfDb4meGo7P7L488IaJ4gWx0qyN0NNv7u0iXU9Nla2hkVJtM1Rb3TiLloiXsnd9obI/E//AIL/ANpf/A/wf+xh/wAFNfBVjqlp4n/YB/am8H6p8SdQ0nSbO9v779lz46Sn4XfHnw/JY3EZaZdWsL7R9NiuINsumNq93e209vcqdQsP2N/Zn+Lfgz4j/BLwD438I+AW+FvhXxNps03gbwLJBo9nqQ8Ox6ldWunXdronhxvsFhFrJhkvrWGzR4TbvDcPI3nszdF+0R8GPDf7TfwC+MnwA8c6VYv4T+Mvw18Z/DrVX1S1stWbTo/FXh+60qDW47GTz4nvtAvp7fW9OEzwywajYwSQy21wIpYv1WjKNbD0m6irxqUYJ1FGUY1U6ajKajNKSjN80oqSTSaulof6MZJilmGS5VjHjaWZPGZZgcRPH0aFbDYfHSr4ShOeLoYbEQhXoUMW5TxVKlViqkKeJipWei5yyura9t7e9s54bq0u7eK6tbm3kWWC4trhElgnglQsksM0TrJHIjFXRlZSQQa+VP2w/wBrHwn+yj8NZ/EV8bHV/H+vxXll8OfBdzNPH/b2rwLCs19qT2iSXFn4b0X7Vb3OsXo8tpDJbaXZyf2nqVkjfGH/AASB/aF8b6n/AME67O1/aXTWNI+Jn7E+s/FX9mX4161qukatanVf+GaZn0/TfFennUFfUfEa6j8Lx4Ru9Q11DM2v+JV1ueIvJIUHhH7OGmap/wAFCv20vE/7Q3j7RCvwh+EcemJoPgzXQuqaejrDfQ+BvDEkEzpbTTfb4tW8f+KPKgu7KPVAmkXMBstbjZvhswnUw1T6pSs8TVqzo029qcY61MTJW1hSptSUdOepOnC9nI/KvEjinMcneUcI8MzpPjbjPF1styWdWHtqWT4GjCUs34pxdG1qmGyXCt1aVKTSxGOlhqTjUhGcJ/Yv7G37M3jLWvEtz+17+1FIvib43+OobTUvBOjalFutfhl4UubKKXSlttIngSLQPEDW1xNHa6RCJH8J2U9zG9x/wkGsa95P0P8Atl/suWv7VPwkuvB0PiLVvD3ijRXm1zwZMmt6paeFLvxDDblbS08ZaHbfadP1XTZ2Ahh1STS7zWfDUsr6jojkPqGm6p9Y1OvQfQfyojh6UaMqDTnCakqrqScp1XP451JpxlKc92042tGMFGMIxXr4TgPh3D8LYzhGvhqmYZdmtLFf25iMbWq1MwzvHY+08fmuY41TjiK2YYnEKNdVnUcMP7HC0KFGOFwtLDS/iL+LHwi+IvwQ8aaj4A+Jvhi88MeKrKOO6FlKYLy2v9Lud32HU9OvtPuL3TdQ0+5WFoY7qxvLq2We2n0+WX+0bK9ii8zIXpgfTbweuQMsQcdyF56euP7aPjB8DPhV8evDL+E/ir4N0rxXpg817Ce5ja31jRLmVVVr3QdatGh1TSLohEEr2V1FHdxKbW+iurOSW3k/EH4yf8EbvHukyXuo/Arx/ovjHSkjuri38MeOi/hrxSixhWttPtdZ0+3ufC+t31yTIHvLy28D6fCzKvkrES0fzGNyHEwfNhL4ild/u3K1aC6Xc2o1drXi4zel4tvX+LuP/o2cWZBiKuM4PhU4pyNyqThh6TpQz/A07JxpV8LKrhqWZRiouKxOXzjUn8dbARl7tT8VeF6cfT34/XpzSFycff8AlBAznoRjHfjHGOmCa9m+Jf7O/wAbvg5d3dn8TPhh4z8KfY5fKfUr3Rbq48O3LFFf/iXeKLAXfhzVU+bYJNN1K5QyBofllV1XxsruOBIqsMAjKoeRkAhxtLbcMAGyAQSQWArwalKrRly1YSpSV1y1E6ctN7KXK7el15n8747A4/KcTPB5ngcbl2LotqrhswwuLwFenKNm4uji8Nh5NxbXv0/aQTaam2rjMHgMxPPTnbjsMdMDHJx+WacKkdQANpXjGckn8DjOD+FNwCduQWyBgYbOc4GNynJ9OOMsTgVCV9brte6/zb+5M89VoT+0k1paTV1fXRXduZ2b2cnZvdNpSc5x9Mcd+f8A63+TXoPgr4S/FT4lSmD4efDfxz42dWiSQ+FvCmu6/HCZmKxm5l0qxuobSNiGJkuHWNUVndhGrsP0O+FH/BIn9pzx5HY6l42uPCHwh0e5aJ54fEd+2v8AiwWksSyrcQ+HfDi3uniT5kjaw1fxJod/CwlW4it5IwknXh8BjMS17HDVZxf2+SUaVu/tZqELeab22PsuHeBOMeKpxjw/wxneaRlJReIoZfXpYGF2ouVTMcZHA5fGMG48/Li60oxbk4PlaX5YdNxY7Qqs7FlIVUGfnYnAVRjDMSFBOecYr6t/Zt/Yu+O/7Ul4s/w98ORWnguHVP7K1v4ia9cxWPhTRpUijmuUDM41DXr6CKWLzdM8O2upXVs89r9u+xW1wtyn78fs9f8ABKn9nz4N3X9u+OfM+N/ifyo1jPjDR7G08F2E0cgka607wSkupW8s8gVIWOv6rr8SRJ/o0NvLJNJL+mumWFhpVlb6bpdlaabp1lDHbWVhYW0NnZWlvGCscFra26RwW8MY4SKKNEQcKoFfRYLhr/l5jqiaTT+r0ZS18qlVWdu6prVaOXU/pbgT6LOOrujjfEDMYYLD355ZBk1aNfHT5aicaeLzmMXhMNTnGN6lPLqGIxKU3COLpTXtF8a/spfsHfBb9lO2t9X8P2cvi74nSadLYar8Stfj26i8NyF+12fh3R0nuNN8LaZKFEHlWRuNWubNY7XV9c1VI0YfbydD9f6CoqlTofr/AEFfW0aNLD0oUqNOFKnBJRhBKMVovm29223JvVts/svJsiybhvK8PlGQ5bhMqy3DJeywmDpRpU+eSj7StVlrUxGJrOKnXxWIq18TXqXnWrTlblmTqfp/UVLUSdT9P6ipa1PUl8S+RJH3/D+tSVHH3/D+tSU4/EvX/M1CpI+/4f1qOpI+/wCH9a0jvL/EBJRRRVgWKcn3h+P8jTacn3h+P8jQNbr1X5k1WKr1Ypx+Jev+ZpH4peqFXqPqP51PUC9R9R/Op63LClXqPqP50lKvUfUfzoAnpyfeH4/yNNpyfeH4/wAjVR2l/hAtp0P1/oKanU/T+opydD9f6Cmp1P0/qKI/DL0QEtSR9/w/rUdSR9/w/rWq2XovyAkpV6j6j+dJSr1H1H86ZUN3/hZPRRRV0936fqOnu/T9SVOh+v8AQU+mJ0P1/oKfWpUfil6ocn3h+P8AI1NUKfeH4/yNTUFlipk+6Px/mahqZPuj8f5mtftv/CgHVOvQfQfyqCp16D6D+VS/j+a/QBaKKK1A/nKTqfp/UVLUSdT9P6ipa/nc/m9br1X5okj7/h/WpKjj7/h/WpKC38fzX6BX8amrf8rRcX/ZQ9F/9Y6sK/srr885/wDgmP8Asz3P7bC/t9Sf8LC/4X0urW2tDb4rtx4K+22vw9i+GcX/ABTv9imfyv8AhGoU3R/2rk6hm63BT5A9nJ8fQwP9pe39p/teV4rB0uSHP++rW5Of3o8sNNZa27M97J8fQwLzL2/tP9qyvFYOlyQ5/wB9W5eTn96PLDTWWtv5Wfi5/wAHSn/JNf2O/wDsd/i//wCmLwLX9MX7P/8AyQj4Lf8AZJvhx/6h2i182fts/wDBPX9n39v/AEX4faH8fP8AhOPsXw01LxBqvhr/AIQnxLB4cm+1eJLbTLPUv7Qkn0nVRdReTpNp9nRUhMT+axZ9+F+z/CXhzTvB/hfw54S0jz/7J8LaFpHhzS/tUonuv7O0TTrbTLL7TMEjE0/2a1i86URoJJNzhFB2i8TjqFbKcqwMOf2+EqY2pWvC0OXEOLp8k+Z8zsnzLlVu7LxOOoVspynAw5/b4OeNnWvC0OXESi6fJPmfM7J8y5Y28z+Q3/goj/ysSfsY/wDYx/sl/wDqwtTr+iP9s7/gpD+y7+wXd/DvTf2gPEHirT9X+Jt+IvDOl+GfBuseIHOjWuq6bpfiHxRf6ksdpoVto/hQ6pZ32t2aatP4nkspFfRPD2sXEkNvJlfFv/gmh+zZ8af2tvh1+2n4z/4WAPjN8MLvwHe+Gf7I8VW1j4SM/wAOtWm1rw7/AGjoT6NczXafbJ3+3qmpQfaodqKYSC59h/a0/Y0/Z+/bc+Gn/CrP2gvBi+JdGtbxtU8Oa5p13Jo/i/wXrbwm3OteE/ENsrXGnXbxFY7yznjvdG1aGOK31rS9Sto0hXqr47LsV/YlPERxMqGCwP1XGKko06im6tSalRlLnU4x5oyatByScU4uzfXXx2XYp5JTxEcTKhgsCsLjFSUadRT9rOalRcudVIx5oyatByScU4uzf8+f/Bdz4Nf8E1/F/wCy1q/7Vnw98R/B7Tv2kNf1jwdc/DnXPhD4q8NS3Hxwj13xJpUHif8A4SXw74bvZ9O8UQ2PhG71jxJceOJbGLXLC80fS7C71+a2vE0TUPFfih8Bvjh+07/wbk/s9+LdZtNd8R+OP2e/EmrfFfQ7a7jubvxJq3wL8K+JviX4DgRYpgZZNN8N/D7W7DxHpzgLu8D+DLCW0M6vEtz98fDX/g2i/Ye8F+O7TxT4v8e/HP4q+GtMvo7yz+H3ibXfCujaJqSRSB0svFOqeEfCuia9qlmwAE0eiX/hd5iCJJDCzwN/Qponh7QfDuhaV4V0HRtL0bwzoekWXh/RvD2l2FrY6LpWhabZR6dp+jafpltFHZ2el2NhDDZWtjBDHbQWsUdvFEsSKo7quc4bB0Mvw+BxGJzGWCx6xsa+Mpex9nSVN0lg6Sc6tRQlCc1OXNyRbShGyjGPo1c3w+EoYChgq+Jx8sHjljY18XT9j7OmoOmsJSi51ZqEoTmpvm5ItrkjZRjH8OP+CLP/AAUs+Afxs/ZI+EXwQ8bfEnwh4D+O3wK8FaF8LNU8G+MfEGl+HbzxX4X8FWEOg+DfFvg+XV7q0j8S2tz4WsdKtfEEFi82qaNr9pqH9pWcWnXmjalqnEf8Fx/+CkXwM8CfsofE39mb4XfEHwx8S/jp8b9Dm8HXnhzwJrNj4r/4QHwFJJHf+PfEXjSfQ57y10VpvC9lqGkabpF7c2+rzPqw10WUmiaTqNwvVftH/wDBur+wt8c/GuqePfBd98R/2fNU1y9mv9X8OfDC+8OzfD2a7upGmu7nTfCXiTQNVk8OtNKxaPTvD2saZ4ds0YxWOhW8YRU9i+BP/BDD9hf4FfCj4o/DXT9G8ceMtc+Mfg2/8A+NPiz4u17S7j4jWvhbVZIJtR0bwXc6doNh4d8GWl1LAguJtK8Ptq2oW6x2ms6rqtvBAkeft+HY42GZwqY+TeIjiXlzw8FGnVdVVZ82J9o1OjTm5VIwhDnqNRpqUYtuMOtw/HGRzGNTHSbxEcQ8veHhGNOq6qqzvifaNSowm5VIwhDnqWjTUoxbcfCP+Dav/lHXq3/ZxfxM/wDUb+Hlfnd/wbA/8l2/bh/7Fv4ef+pj46r+mz9jn9jf4PfsNfCOf4K/BD/hKv8AhC7jxdrPjWT/AITHW4df1f8AtrXbPSbG+238OnaYgtPI0Wy8mD7MTG/msZH8wBfKP2Kv+CZv7NX7Bfib4l+LvgR/wsH+1vivaaTY+Kh408VW3iK1EGi6hqep2X9mQwaLpbWb/adXu/OZ5LjzI/KQBShZpr5rhakOI+X2v/CpWoTwt6dtKdWE5e199+zfLF2+O700IrZphai4hUfa/wDCpUoSwt6dtKdWM5e199+zfKnZe/d6aGR/wV9/5Rofti/9kjvf/T1o1fEv/Bth/wAo5H/7OA+J/wD6bPBdfs58fvgf4J/aT+DXxC+BXxH/ALY/4Qb4maBJ4b8S/wBgX6aXrP8AZ0tzb3Tf2fqElteJa3Hm2sWJWtZgF3DYc5Hm/wCx1+x38IP2HPhF/wAKS+CP/CU/8IUfFeteMSfGGtxa/q51jX4dOgv/APT4dP0xPsvl6XaiCD7NmM+YTI+/jmhjKMcmxGAfP7erj6GJjaP7v2dOlKErz5tJczVo8rutbo4qeMoxyavgHz+3qZhQxMbR/d+zp03CV582krvSPK7rW6P5i/2HP+Vkz9qb/sZP2mv5W1ej/wDB1d/yKP7E3/Yx/Hr/ANNnwlr90vhp/wAEyv2afhR+2H43/bi8Kn4hf8Lu+IF54zvtfGp+Kra88Hifx3sGu/YdATRYJ7ZP3Y+xq2pzfZ+cmXjG1+3D/wAE5P2df+ChNh8ONN/aB/4Tz7N8LLvxTfeFv+EH8T2/huTz/F8Og2+r/wBpNcaPqwvE8vw7p32VVWAwN55Jk80BPTjm+DWcZZjn7b2GEwOHw9X937/tKWFqUZckOf3o88laXMrq7stj2I5thFm+XY1+19hhcFh6FX937/tKeFnRlyx5/ejzyVnzK6u7LY+s/g9/ySP4W/8AZOfBH/qM6ZX8jn7dn/KyX+yl/wBjL+y//wClNzX9iXh/RLLw1oOieHNN87+zvD+kabolh9okEtx9i0qyhsLXz5QqCSbyII/NkCIHfcwVQcD4K+J3/BMj9mj4t/th+Bf24vFn/Cwv+F3fDy88FX3h/wDszxXb2fg8z+Ankk0E3+gPotxNcpukb7aq6nD9pAGDFyT52V42hhMTjKtbn5K+Cx2Hp8kOZ+0xEZKnzLmVo3a5nd8vZnBluNo4TE4urV5+Svg8bQhyR5nz4iM1T5lzK0byXM7u3Zn6HJ94fj/I1NUKfeH4/wAjU1eV9h/4keX9h/4kfh7/AMF8v2KP+Gr/ANifXfHnhTSft/xc/ZiOq/Ffwl9mg83UdX8FRWUS/FbwnAVWSZ1vfDdhb+LLW0t4pLvUNc8FaNplsFN9Lu/Ff/g39/Z/+In7Zf7Xniv9vb9obVNV8eWP7PHh7wn4E8GeIPEYW5bX/ilYeBNL8E+FF8xo/s96/wAMvhhpltfXjSRrfR+Ite8G+ImuJdRFzcSf20tFFPHLBPHHNDNE8U0MqLJFLFIuySOSNwUeN0JV0YFWUlWBBIrwP9mH9l/4P/shfCyP4OfBDw8PDfgiLxZ418YrZu6T3T6p428S6h4hukuLpYoXuYNHt7uz8M6GZxJcWnhnQtE02We4NkJn9vDZxPD5PicvSbqVJyhh6tlejh69njKal8UfaezhypNJ+0qX2R7mEzadDKsRgLN1JzcaFXS9KhXs8VTUvijzuEOVJ2fPUvsj8uf+DhX9m3xX+0J/wTy1/VvBGmXWs+IvgD8QPD3xyn0nT4XuNQ1HwloeieKPCnjUW0KKxkj0Tw94wuvGN8BiT7B4XufJ8yXbBN4f/wAEWf2u/wBhH9oP9kz4U/CH4iaR+z34U/aJ+CvhHSfhx4o8MeP/AA98PtI1zxronhK2TR/C/jvw3feILKCXxfHqnhy10xfE72s11q+k+JYdS/te2isb3RtS1b+jl0SRHjkRZI5FZJI3UOjo4KsjqwKsrKSGUgggkEEGvwR/aY/4Ny/2DPj54z1Xx/4Nn+I37O+t67eT6hq+hfCjUPDzfDy5vruRpru8s/Bnibw/rC+HmlkO6PTvC2raH4etVLrbaHEGBWsHjcHPL1luPqYnDRhXlicLi8NF1HTnOKjVp1aSnTc6c7JpqV0+iaTemExmFngnl+NqV6EYV5YjDYnDxdR05Tio1KdSmpwcoTsmmno+iaTeL/wUW/4Kff8ABPP9h7/hE/DHgP4Mfs+ftK/FvWfEmnR+I/h94C074dG28GeDI5C2tan4k8U6T4a8R6fpPie5j8q28M+Fbm3bUb2S4Op6hDZaVDDLf/uF8E/EOm+LvhF8NvFmjfDrW/hHpXinwZoHiSw+GXiXQ9I8NeIvA9trunwarH4d13w9oV3faVour6eLvytR0y1upDZ3fmwTiK5SaGP8o/2Ov+CCv7Cn7IfjPR/idHpPjL45/Erw9dwan4a8Q/GbUdF1fRvCmr2rrJa6v4c8GaBoWgeHk1OzlSO507UfEVv4l1HSL+OPUNHvNPvIoJov2srLHVMB7OhRwTxNZ0+aVbF4mU4Os5JKMYYZ1KkacYWdpN87u07q7M8VUwPs6VHByxNZ03J1cViJTi6zla0YYd1JxpwglpJtTd2ndXY5PvD8f5Gv4fte8fN/wR7/AOC+PxR+KHxb07VLH4CftIat498QX3iuz0+6u4h8Mv2gvEFt42vvEGl21tFLc6ha/Df4s6XFp/iLTLKC41RtK8Maj/ZdjeXF3pEd5/cCn3h+P8jXyX+2J+w1+zZ+3Z8Pbf4dftFeA4/EtppE9zfeEvFOlXcmh+OfA2p3kcUV1qHhPxNaq1zY/a0gtv7R0q8i1Dw/rBtLL+2dH1AWVoIbyrGUsLVr08RCVTCYzDyw2JjTaVSMG1OFSnfRypzSkk7XWzuknWXYunhp1oYiEp4XF0JYfERhb2ii2pRqQvo5U5pSSdr+qSfXn9sT9k6L4eH4syftK/AtPhqdOGqr42PxT8Ff8I+9l5RmBS/GsmN7kqRGtgm6/a5Is1tjdkQ1/EV8Xf2zNA/bn/4L1/sm/GLwJBqQ+FGi/tFfszfDP4R6pqthd6bc+J/BPgz4tWouPFcdpexQXEFh4i8aal4v1LTILiGC9tNOntbLVLa11e2v7WH9rPBf/Brr+w5oPjO313xP8Vv2iPHnhKyu0uovAup6/wCCtDg1OJJNw0/xB4i8NeC9M1q4spY8x3DeHpPC+oscPb6hakEH9FPEX/BHr9inW/2gfgR+0ZpnhTxT4H8V/s32vwzsfhV4U8Ca/ZeH/h1o1l8JvEV14p8K2914ZGiXU195msXlzc65cSaol5rUs81zeXDXtxcXUvp4TEZPl9TEyo1sXiqlfCYijGpPDxowoe1pSjGPJ7SUqk6knFTneMKcIu0ZOWnfhq+U4CdeVKrisTOthsRRjUnQVKNH2tKUYx5OdynKcnGM53jCEIu0ZOWn4O/8F9Phz8U/2R/2/v2XP+Cnnw78Py674TsL74dWXiCRlmGmWnxK+FOtXeoWvhvxHewxSHTNK+JHw/MGjabMsbzu2g+KGjdZks0b+in9nD/gqb+wp+018M9J+JHhH9oz4WeEZLjS4L3xJ4F+J3jrwr8P/Hvge98lXv8ATfEvh7xLq+n3Cpp9wJrYa9pjah4Z1TyJLnRtZv7QrOfsj4l/DL4ffGTwL4l+GXxU8HeH/H3gDxhp0mleJfCfifToNU0bVrJ3SVFuLW4Vgk9rcRQ3lhewNFe6bf29tqFhcW17bQTx/wA9fxN/4NeP2GPF3ie513wB8S/j78J9Hvbl55PBmm6/4W8XaDpsTPkWeg33izwxe+KLe3RDtRte8QeJLnOGa4YfJWEMVl2Ow2Fw2YzxGGr4KMqVDE0KUa8KtByc1Sq03KMlKDb5ZJtbbXkiYYjA4vB4ehjp1sPVwsHSpYijTVaM6Lk5KnUpuUWpQbtGSdrW80fnx/wXe/4KMeBv27NV+D3/AAT8/Ynu3+O11efFfRde8U+KfAqnU9C8X+Pxaan4X8DfD3wJqaYtfFFlDL4k1LWvEXiKxd/DS3MXh8adrN4llrbWW9/wXM/4J7eMPgn/AME8v+CfvifwlHNrj/sX+DrT4PfF7V9ESeWOCXxzpnhC4HjxG2JJZeHrf4neHNS0+Gd8Sw3PjrQ4ZQ215k/oE/YZ/wCCRX7F/wCwDfv4r+EHgzWfFXxUmsp9Ok+MHxT1S08VePLWwu4jDeWPh82Wl6H4Z8JW95E81veTeGPDulanqVlM1hq2o6jaKkS9/wD8FEf21/2af2Kfgzp2uftWeDfFnjj4VfF7Xb34TX+geHfBeheOdN1WXV/Des6pd6L4o0bxDrei6dNpGraJperQvBK14t0IpoXtjHucdVHMoU8Rl+FymhWrUcJWqzcaiiq+NrV4ShXlyp8sP3XMqcW3ZxTasrPenmEaeIy7DZbRq1aOGqVJ2qKKr4upWg4VW4p8sL0uZQjfRpNqys+L/wCCf/8AwVE/Zp/bX+A3grxtD8VfAHhP4t23hvTIPi78K/EnijRPDvijwl4ztLKKHxDcWmkateWd1qng7UNQjuL/AMNeJdOin0270ueC2u5LHW7TVdI0/wDDH/g45/4KSfBP4hfBXS/2L/gJ450D4reI7/xpoXjv42eI/Amp2vijwj4I8M+EppU0Pwrf+ItHlutHm8S6z4x1DRru7tbS+uX8PR6Gun6zFa6hrmnRD3w/8G5//BOf9qjw74C/aJ+A/wAQ/j58Ifht8ZvCHhb4neHvBeka14V1/RbDw3430Wx8SaXaaWvivQvEPiLRLpLHUooryy1PxX4oi0+7SS1gYRQbG8M/4K//APBP/wDZJ/4Jw/8ABKPWvBHwK8NXdt4n+Jnx7+EGj698RvGupW/iD4l+P77R7Xxd4igstU1qGx0yytdM07TdH1O9t/D/AIa0jQvD8EyT6gdLbUbi6vJ9cFDKIZphp4eeMqVZYpRp4SpQjTjhqjlNP2tbnk6kaDU+SEI3k4x5pWi29sJDK4ZhQlRnip1JYhKnhalGNONCblNN1KvNJzVFqXLGMbycY80rRbfsVl+zL4p/as/4Nmfhj8PfAWmXOt/EDwz8L0+KvgvRLKF7m91vU/hv8WvE/iDVtE060iDT3ur614Ri8SaVodjbgz3mt3mn20SSNII32f8Ag3r/AOCmnwF1r9lPwj+x38XfiN4U+Gvxj+Cl94i0rwbbeOdd07w1ZfErwFrviLVPFGkyeG9U1i4stOvfEfhm51q/8O6h4Xhm/tb+xtL0nWrSG/hm1V9M/Vb/AII2aDf+HP8Agl/+xhp+owvBcXHwgtNejSRCjNYeKtd1zxPpcwB5KXGmaxaTxP0eORHXhhXy7+2H/wAG9/7Cf7WXj7W/itYJ48+AHxB8T39xq3iq7+EF/oFr4R8Ua1eytNf65q3gnxFoOtabZavfTM1xfXPhW48Mw6jfSXOp6pbX+p3l1eTZPF4Scswy/HOrClLMq+Jw2IowVSVGt7WpCSlTco89OpFa2d07+TWMsThZvHYHGOpClLHVsRQr0oqpKlV9pUhJSptrmhOK1s7p38muk/4K7f8ABTv9n39m/wDZV+Lvw88HfEzwh8QP2ivi94D8TfDX4cfDbwJ4g0zxV4k0q88b6PeeHrrxv4ks9Cub+Tw7o3hfTb+91qwk1hLc+IdWsbTRtNiufOvZ7H4A/wCDUL/k239qn/suHhf/ANQK1r79/ZP/AOCB/wCwt+yrpvjS4tLHx38WPiB448D+L/h9cfEn4k6vo1zrfg/w/wCOvDuo+FfEv/CuNJ0TQdJ8P+FdVvtE1S7tE8RXWna54ltI57u1tNZh0y/v9PuftX9hf/gnp+z7/wAE8vB3jjwP+z5/wnH9ifEHxLZeK/EH/Cc+JYPEt5/athpcekW/2G4g0nSVtrb7JGu+FopS0uX8wA7RNTFZfRy/E4HDPEVKlath6nt6tNQVX2bbklBTl7KEI2UFJylUcpSfLZIznicBSwGJwWGdepOrVoVPbVKagqns23JKCk/ZxgtIqTlKblKT5dEfzNf8EU/+U+P/AAUl/wCwZ+2d/wCthfDKv6p/25P+TKf2wf8As1v9oH/1U3i2vC/2cf8Agl3+zF+y1+1L8Yf2v/hefiKfi78cYfiJB43/AOEj8WW2r+FvL+J/xA0X4leJv7H0WLRLGWwb/hJNBsf7OL6hdfZNP861YTtIJk+4viX4A0D4r/Dj4gfC3xX9t/4Rf4leCfFfgDxJ/ZtytnqP9geMdCv/AA7rH9n3bRTra3v9najc/ZbloJlgn8uUxSBShxx+Lo4nG0K9Pn9nTo4GnLmjyy5sPClGpZXd1eD5Xdc2miuRi8XSxGNoV6fPyU6OEhLmjyy5qEaaqWV3dXi+V3V9Nj+ZD/g1C/5NZ/af/wCy/wCkf+q60Gvlvx3/AMraWjf9jP4A/wDWD9Er+m79hb/gnv8As/8A/BPHwR41+H/7Ph8cHQPHviq38Y69/wAJz4kt/Et9/bFtpFrokf2K5t9J0hbe0+xWcO6BoZWM2+TzAGCjitT/AOCXP7MGr/t4W3/BRW7HxF/4aHtr3Sr6PyvFtungTz9I+GFt8I7Mt4ZOiNcFB4StYvNUauN+qBr3Ko32eupZlhnj80xS9p7LGYXEUaP7v3uepTowjzx5vdjeEru7sraO50vH0HmGY1/3ns8VhKtKl7nvc9SFKMeZc3uq8Hd3dlbTU/Kb/g6x/wCTEPgX/wBnb+Ff/VOfGuv2d/4Jo/8AKOz9hP8A7ND/AGdf/VS+E6tftyfsGfAn/goT8MPDPwj/AGgf+E0/4RLwl49sfiNpP/CD+IYPDeqf8JFp/h7xJ4Zt/tN7PperJNYf2Z4p1TzLUW8bNcfZpRMohKSfRPwb+FXhb4F/CT4Y/BXwP/aX/CF/CTwD4R+G/hP+2bxdQ1b/AIRzwVoNh4c0X+079ILVLy//ALO063+13SW1us8/mSrDEGCLx1cVSnlmFwi5vbUcVia07xtDkqxgoWlfV3i7qyt3ZzzxFOWX4fCrm9rSxNerK8fd5KkYqNpX1d07qyt3Z/Hp/wAHCP8Ayls/4J0f9iz8FP8A1pjxRX9rlfnD+1d/wS1/Zf8A2zPjx8Iv2jfjH/wsb/hYnwUs/Dlj4L/4RTxbbaHoJg8LeM73x1pf9r6ZNoeoyX7/ANuX9x9pZLy286z2W4EbL5p/R6jF4qlXwuW0Yc3PhaFWnV5o2jzTrOa5Hd8y5Xq7Kz0sGKxFOthsBShzc+Go1IVLxsuaVRyXK7vmVt3Za6E69B9B/Kv4Cf8Agqd+0TqX7Jf/AAcOf8NHadot/wCI4/hJffATxTr+g6WgfUtW8Ep8EfDNh8QLGwZ2WGC7uPA974hS3u7lls7KUreXrC0gmNf37L0H0H8q/Nbx/wD8Eov2Tfib+2pY/t5eMbDxzqvxrsv7GR9Ln8SafP8ADbUrbRfBH/CvoLDVvBt3oFyuoafeeG91vqVnPqRgvpZJGlTypGgNZVi6GDrV54iMp06mEr0OSKvzyqcq5W7rljJKSc9eVtOzsXluJpYatWlWjKcKmGq0uWK+Jz5fdbuuVNJpy15dHZ2Pe/hP+3R+x/8AGz4Y6d8YPh7+0d8H9T8BX2lRatdapqPj7w14fuvDcTwLcT2XjHSNd1LT9U8H6tYKSupaV4jtNNvrJlPnwqhV2/jm/wCCt37QHh//AILK/wDBR79lL9jT9knUz8Q/AHw71XVfBUnxK8Pxvd6BqOt+PtY0HUfjF450S5VCmpeAvh54J8D6Vdf8JIqG01afRvEN1on9oaRPo+oat+wfx2/4Ngf2CPit491Hxv8AD7xb8ZfgJY61fzX+p+AfAmreGNZ8C2clxI01wvhWx8XeG9W1vw5DLLJIyaede1LRbCMxWmj6TpljBHaj9L/2CP8AglZ+yD/wTq07VZvgN4Q1fU/H/iOwXSvE3xf+I2p2vib4lazpCTxXP9iR6lZ6ZouieHtDku4Le6u9I8KaBoVnqlza2FzrKalc6dYT2/dRxGW4ByxWHqYmvieScMPSq0Y04UJ1IuDnUqKclUcIyduRJStey5nbso1sDhHLEUJ161fknGjTqUowjRlOLjzVJqUlUcE3blSUrXsru35u/wDBz5ZWum/8ExfDenWUK29lYftHfCWytIEyVgtbXwj8R4LeFSxLFY4o0RcknCjJJ5r9Gv8Agjh/yi8/Yk/7Ib4e/wDSrUa9r/bX/Yl+Cv7fXwbt/gX8ev8AhLv+EHtvGWieOov+EK16Hw7rP9u+H7LWLCw3ahPpuqobP7Prl959v9lDSP5LCVPLIb1/9nv4F+Bv2Zvgp8NvgH8NP7Y/4QP4V+GbTwn4W/4SDUE1XWv7Ksnlkh/tLUY7ayS8ud0z75ltYAwwBGMVxVsVSlllDCLm9tDGVa8rx9zknTUVaV9ZX3VvO5zSrweApYb3vaQxNStLT3eWcFFWlfWV07q3zP4/v+DZ7/lIT/wUK/7FrXP/AFd01f221+bH7Gn/AASx/Zc/YW+LPxY+M3wN/wCFj/8ACY/Ge0ubHxl/wmPi628QaSILvxK3iqX+ybGHQ9Mexf8AtRjtZ7m5222IcE/vK/SepzbE0sZi3Xo83JKlRiuePLK9OnGEtLvS6011WoY+vTxOJdWnzcjp0o+8uV3hTUJaXel1prqj+JP/AIN3v+UuP/BRr/sV/jX/AOtM+GKd/wAHU/8Ayc7+wH/2LPjX/wBWD4Kr+kj9kr/glf8Ast/sW/Hr4vftG/Bn/hY//CxfjZZeI7Dxr/wlni6213Qfs/inxnZeO9U/sjS4dD06Swf+3bC3+zs95c+TZ77ch2bzRJ+2/wD8Erf2W/8AgoN4z+Ffj39oD/hY/wDb3wes9SsPCH/CEeLrbw3ZG31TVdN1m6/tW3n0PVmvX+2aXa+WyS22yLzYyGLhl9T+08Ks1p45+19hHDQpP937/OsM6WkObbne/Ntrbodqx9D+0YYr957KOHjSfue/zKh7J+7zbc3W+2tuhv8A/BWL/lGh+3R/2bF8XP8A1EtQr+UH/gkV/wAEofgV/wAFFv8Agkd+0YuoaBoPhj9pU/tM+KtP+Ffxynt7iXWPD154F+FPwx1jwp4S1aeMzy/8K71jUvGvia08WaZY2rSXC61Br/2e/wBb8L+GWsP7bvjr8GvB37RHwb+JvwL+IX9q/wDCDfFnwXr/AIC8V/2FfJpms/2F4jsJtO1H+zNQkt7tLO9FvM/2e4e1uFik2sYnA2nwr9hr9hL4Gf8ABPX4Q638Ev2fv+Ey/wCEK8QfEHWPiXqH/CceIYfEur/8JLrmgeFvDd95N/BpekpFp/8AZvhDSPJtTbM0dx9qlMzCcJHxYPH/AFbL6tKlOpTxMsZQr05RT5eSlFqSlLmSabaTg4uMo3T8ubD4z6vhKlOnOcK8sTRrQcU+XkpxakpO6um7Jwaakrpn8zn/AAQl/wCCk3xC/Zi+Lep/8Ej/ANu06j4L8SeEPFt/4G+BWteMrgJceEPF0d0c/BDVtUmke1vPDPiWSZNU+DmtxXM2nzyahb+G9HvtR0XxD4JttN9V/wCDuD/k3T9kb/stXjf/ANQaKv2J/bb/AOCOH7FP7fHxP8OfGf40+HvHGhfE7w9ocHh6Txf8LfFkfgrVPEWnadcrdaE3iZzpGqx6nqHhxjPb6JqyR22qW9jOun3F3dWWn6RBp3e/tff8Evv2d/25/hD8Gvg3+0Z4i+MXi7RvgjKt34b8UW/jew0/xzr+ojQIPDc2q+NdeXw1NBr+qXtjbpNf3q6dZTXuoNNfXDSTzSluuOOwSx+EzCMalKV3PGUY07wVXknF1KL5lzKpKV5Rai03zXb5r9KxeF+uYTGKM6cm5SxNKMLxVRwknOk+ZXU5O7i0mm7/AM1/g/8A4KG/sxeLv2rP+CDHgvwV8PdKu9f8f+Bv2cP2afjH4T8P2EL3N9r03w48D+E9U8R6Rp1rCr3N7q154Hn8VJomnWkU13qetjTtNt4nlu1FfG3/AAb7ftm/sH/FX9lDwX+y98cNJ/Z+8JftG/BibXdCtR8UPD3gHS734s+C9R1/Ute8N694b13xNYxR+INc0Wz1V/DGuaBFf3WvW8OgW+vNanTdSD2v9U3w98EaJ8MvAPgf4b+Gftn/AAjnw+8H+GvBHh/+0LgXd/8A2J4U0Wy0HSvt10scK3N59gsLf7TcLDEJpt8gjQNtH4gftjf8G6H7AP7Wnj3XPitplv8AED9nj4geJ7+51fxRcfBjUvD9n4N8Ta3fStNf63qngXxN4e17StP1O9lZri8k8IT+Fba/vpLjUtStb3Uru7u58sPi8NOhXweKlWpUp4mWJoYijHmnSnJyUozpqcHKE4tXSldO/ZMKOIoypVcNXlUpwlWlXpVqSblCUnJOMoKUXKMotbPR/JmP/wAFMv8Agpd/wTe/4J+eCLGPwt8Jf2Zv2ifj1rOsaRb6V8FPBem/DVptO0AX9vJ4j8QePfEmieGvE0XgW0h0dbuDw/DqGm3era5r1xYLZaNdaNa69qWledf8Ff8A4leHPjL/AMG+PjD4s+Efg5r3wB8OfEiw/Z+8ZaR8JvE2gaB4Y1rwtZ69+0B4CvonudG8Mzz6RBb68sv/AAkml3EX2a71HSdYsdS1TTtK1S7vNMtPVf2Rf+Dbz/gnr+zB420b4k+JLPx/+0j4z8P3lvqegxfGvUvD974D0XVbR1ltNSt/AHhnw9oOk6zPA6+Ylv41uPFumRzCK6g0+G7t4J4/1t/a9/ZO+FH7bfwC8Yfs2/GoeJR8OPG914XvNaHhDWItA14S+EPFGkeLtIFlqc1hqUVug1bRLIXKmzl86186BTGZBIo6+AoVsF7CWJrewxEK1fE1eaLnGMovkp4d1JJKKTak2pttq7Tdj22EpVcN7J1qipVo1KtepzJyimvdhR55JKO6bak22r6u351f8G7X/KHf9kX/AK6fH/8A9ae+NFfhv/wRD/5WFv8Agpr/ANef7b3/AK2T8NK/ro/ZJ/Za+F/7Fn7PvgH9mj4Mf8JH/wAK2+G58VN4c/4S3V4td8QZ8Y+NPEfj3WPt+qw2Omx3X/E98Uan9l22UPkWX2a3PmNCZZPmz9mv/glR+yx+yr+1h8Zv2zvhZ/wsj/hcnx3i+JMfjr/hJPF9tq/hPb8VviFo3xO8Vf2NocWh2M2nn/hJtCsf7NL6jdfY9O860bz2kE6kcdQUs5b57Y6M1Q9zrLEe1XtPe9z3f8WunmCxVJSzJ+9bFRmqXu9XW9oufX3fd9ddD+Zb/gtnYeN/+Cd3/Bab9mr/AIKZ2fhfUvEPwx8c3Hw813XLjT41T7drnw28P2/wr+J/w/iu5ClpY67q3wej0S98Oz6hNFDeXGqXjxRzwaFqXl/1vfB/9vL9jf45fC/TfjJ8Of2lPg3qfgG/0mHVrvU9S+IHhnw7eeGY5IFuJ7Dxpo2vanp2q+DdY09CV1LSfElppt9ZMpM0IjKSP8D/APBUX9s7/gnToPjv4d/8E7v28Phh44+INp+0pp/gbWvDU1p4T0+78E6HceLPHeufDrQfEJ8dL4x8O+JPBPiTwxrOm317fa74bt/7S0bQdQjmgu7mLUbzT2+Fbn/g0z/YPuPGn9sW3xw/ahsvBbXhu5PBS698NLi7WIyiU6ZbeKpvhubqLT15t0a40u81QWuA+pyXYN4dZywuIwmCWPeJwlSlRdOhXhRVanisPGb5bLni1Om7xu7L5N22bo1sLh/rTrUJQpclOrGmqka1GMnay5laUX7t9vle34Rf8HIP/BRL4YftxftD/CnwN8A9bi8b/BX9m7RvHGgWfxO0tJX8LeO/id41u/C134/Pg/Uii2+veG/Dek+GvA+m2mtwMbfUb+fVb/SjdeH7zRtY1f8AsY/4LZ/8okv2zP8Asj2mf+pd4Sr+Wj/g5C/Zd+A/7NEn/BN39kT9lrwDpPgjStI0X433sHhnS3uL/W9c1f4ieJfg/wCHtO8TeKNXvprrWvEniPxJqXha+tJtZ1e7urqaPTINNtWg07TbKytf7g/2jv2dvh9+1N8BfiH+zl8UzrjfDz4neHoPDPig+G9Sj0bXTp0F/Yaih07UpbW/js5zc6dbkyPa3A8vem35tw2xdWhToZHUpxnChSq1qiU7Sqyp08RS5qklGy56jjKfKnZNqKb5bvatOlCjlkoKSpQlOSUrObjCrC8pJWXNPlcrLRNqKelz8Uf+DXP/AJRZ6V/2X34v/wDoXhqv6La+R/2J/wBin4L/ALAvwRg+AHwF/wCEt/4QG38U+IPGEf8AwmuvQ+Itb/tjxKbM6lu1KDTtKjNr/oMH2eAWgMXz5kfdx9cV4+NrQxGLxNenfkq1pzhzK0uWXLa6u7PR6XZwYipGrXq1I35Z1JSjdWdna11d2enc8o+Pf/JCPjZ/2ST4j/8AqHa1X8l//Bnx/wAk+/br/wCxz+Af/pj+K1f2G+JvDmneMPDHiXwjrHn/ANk+KdB1fw5qn2WUQXX9na3p9zpl79mmKSCGf7NdS+TKY3Ecm1yjY2n4V/4J+/8ABMX9mb/gmtpfxN0X9m7/AIWF9j+Leo+FtU8Wf8J/4rt/FM32rwfa67aaR/ZklvoujCyj8rxDqH2pGWczt5BDR+UQ++HxNKngcbhpc3tMRUw0qdo3jalO8+aV1yu22jv5G9KrGOEr0nfmqOm42WloOTd3fTfTR3P5LfF/jbVf+CFv/Bf74nfGz4s+Hdef9mL9qzUfibrj+LNH025vll+FXx38W6Z491660GGFHbUtQ+DfxX07SrXxH4dgE+vz+G9EjnsrOaXxL4flvv7JdE/4KDfsK+Ivh4nxX0n9sH9myb4etpw1SXxNcfGXwDp1pZW5i85odVt9S1201DSNThH7q50XVLSz1i1ug1lc2EV4rQDpf2r/ANjf9m79t34YXHwi/aY+GGifEnwgbhtR0h7xrrTfEfhPW/JaCPxB4N8U6TPZa94Z1mOJjFJc6VfwR6haNJpuqwX+l3FzYzfwx/tQ/wDBJX/gnR8Jf+CmnwN/4J9fCHV/21/jp4p+J/2e/wDihoXw78a/BKTX/gdZ679l1bQornUPEHwug0rVILHwdHrHjnxa2vXOhyeEfBI8PaxJf+I7nWHtoPSg8Lmap+3dejicPh+WrOlThUp1aGHhpUlzTgqc4wSi7u0nZK7aR005Ucaouo6tOvSpKNSUIRnCdOlHSbvKPJJRVnd2bsle6P7f/gT+1p8Gv20v2ePHXxp+Aes6h4l+GIvvij4G0TxTfaXc6ND4nuPBKXmjaprmj2F+ItTTQbzUI5xpE+p2en315aRpdy2Fsk8aV/Kr/wAGcvT/AIKLfX9kb+X7Ttf1c/sk/sXfBD9ir9nLRf2XvghY+JLP4a6QniOR5vE3iCfxB4m1XUvFtxcXfiDWNS1WWG2tVvr+4uZJPI0vTdM0m0wiWWmW0YKN4f8A8E+P+CV/7Lf/AATOHxcH7Nf/AAsf/i9Z8BHxofiD4utvFR/4tx/wmn/COf2T9m0PRRYf8j5r32/eLn7Vmz2+T9nPm8dPEYanhsyoU/acuIq0fq/PG7cKVTmbqNNKMmtbJPV20sZqrShSxVKPParKn7K615YSu+dp6O2uz1duh/Md/wAFTP8AlZ2/YB/7Gf8AYn/9XDrVf3Mp90fj/M1+ZXxu/wCCT/7Kn7QH7aPwr/by8ff8LL/4Xt8Hb34b3/hD+xPGFrpvgzz/AIWeILnxL4W/tXw9JoV3Pep/aV1L/aSpqlv9rt9sSmAguf01T7o/H+ZpYvEU69LAwhzc2HwvsanNGy5/aSl7ru+ZWe+mulia9WNSGHjG96VHkldW97mb01d1Z76H8Nv/AARo/wCVlT/gpz/2Mn7f/wD6174Vr+5yvzK/Z2/4JO/sp/syftjfGn9uX4aH4l/8Lv8AjxefFS+8dDxD4wtdV8HCf4xeP7L4k+MP7F0CPQbKfT0/4SPT7f8AspZNTujZWG+1c3DN5w/TWtMfiKeJnCpT5uWOGw9J80eV89KlGE9LvTmTs76rWyDE1Y1qkZQvZUqUHdWfNCCjLq9LrR9SZPuj8f5mnU1Puj8f5mnVyLZei/I5wqVOh+v9BUVSp0P1/oKZutl6L8kPpV6j6j+dJSr1H1H86Bk9WKr1Ypx+Jev+YH+e3/wdS/8ABOq0+Cfx68K/t2fDfTb+PwJ+05rU3hr4vQJHaJoXhT446J4fs20m8sxa29rLbL8WPCej6vr00E6ajPL4r8IeNtau9TjGv2Gn2/wh/wAG5v7e837DX/BSj4VQeIvEMeifBb9oueL4EfFpdSnli0a0XxXcGP4e+K78GVYbf/hGfiE2hy3mpXHyWPhvUfEXKpM8q/6LP7dv7H3w/wD28P2Vvi5+zD8RFW20/wCIfh518N+IlWc3Xgrx9o8i6t4F8aWf2We1uZj4e8S2un3mo6alzDb+INE/tTw3qXnaTrF/bzf5A/xO+F/j/wCAvxX8efC34gaXd+GPiN8JPHmveBvFemGcefpPi3wjrV5pV/HBeRkCeCK906WWy1K1cwXNv9nvLacxTQyt9jlGL+sYd05O9XDtQd/tU/8Al3LzslyPzjHue3gq3tKXJJ3nTtF+cfsv5Jcr9Ef7n5LwytChkWOMAqs8KGQRjClZGJQ71PEgfbIGB3fPnP4Vf8FlP2XfGnj3SvBX7QfgTQL/AMRnwJoupeG/iLbaWgur6w8KJI+raP4njsIjJdXNtpN5c63b6vNCs7WNjcW2oNElrFO8Nz/ggB/wUSH/AAUG/wCCePw51bxf4o/t79oP4DIvwg+O0dzPCdX1HVNEgz4L8c3sMLxyyQeOvB9rpl099Lax2954p03xJF50s0DrL+3gmjnV45YTcQSwNFLFLGkkUkcqlZo5Yy8qyRyITHJCxVJYmeKVXjbbW+Z4CnmeCq4KrKUYVLOMopN06kXeFRJ78srNpNXjzLdo+a4/4Ly7xA4UzThbMqlTD08dCnUw+MoRhKvgcdhair4LFU41GoTjTrLlr0m17bD1a1OMoz9nJfwI+Gdf1Xwprmh+KPD19JYa94f1fTdd0TUbfymkstT0y6iv7C6jV0kifyLiCKQoYnikUMJSsPmMv9CXwm/4Lg+GY/CtlY/Gf4SeJP8AhMLK3W2udU8Aalpkmia3cQxGN71tM16fT7nQ3vG33L2Ud5qUdo7i1t7meIBq+zfi3/wSw/ZF+Luqal4jj8D6t8O9b1KeS5urrwD4gOjWNxcTSebc3X/CL3sGq6BHNO5dp20+y01ZJXa4eJ7h3mHmnhb/AIIt/sj6XKk2ta98XvFKKzFLO88SaRo8AVSF8pv7I8NWl4yhcJ5kdxG5Rf8AXIG3j4nBZDxPlFWusuxWDVKo3CUvaU+SrFXUKksPWhzKcU3ZRnpzWTadj+S+E/B36QPhpmeYQ4Kz3heWCx0oU61TEY2hLA42GGdT6rjMRluY5XUxOHxVKnVnFewrzaUpUqkq9JxR+YP7Xv8AwVd+JH7THhPxD8Hfh/4Htvhx8O/GH2XS9XM18+ueOvElpFeC6TR2vLIxaZpdlqjwwQX2nada317fW+62N+qTPC2N+xV/wSz+Lvx88SaR4h+MGg+KPhb8EhBJfXuoazBDo/jHxckRRYdM8N+HNTVdR0y11JEYXXiS+tIraOz/AHul/bbl4pB/Qz8MP2M/2Uf2eru08Q+BPhD4Z0fxBYOgsPFOqtqfizxLHMsSxLHp+peI9Q1zUElZC650prVl8x1hEeXMn08k2vatKgtml8P6W2WknkjiuNcki3YMfl3EbWWmIwCjMrz6iowfJVmAT06XDOIxmKhjc/x316pBKMcLRj7LDqKlzqE3aL9lzWk6dNK8k3zNN3+/yz6PmdcTcQYfinxj4u/1rxmHVFUcjyum8JlEaNCp7aGArVvYYKp9QVS854PL8NhYVpt+1xlWM5RdfQtJ8JfD/SdI8JeHtNstLtNJ0rT9J0bRNLiikvjp+mW0Nhp8BSMKY7eGCGC0iurqWC1UgPczxRiWSTp7WTU5QZrs29gzHAtoYkurpY8YVp7hgbdJQoBZYIpCGORPwJC7S9K0zSo5hptv5M15Is9xclpZ76/uMkxTXd3KWuru4aUlx5rHaxYLFHk1+bX/AAUB/wCCtv7DH/BNXw8t/wDtJfFyxXxreybdF+Dfw+Nn42+L+tFomuFlPgy21G2l0HS5kR1h8Q+Lr3QNDEskRW+uBsgl+xSSSSSSilFJJJKMVaKSSSSSVkkj+pKdOFKnTpU4xhTpU6dKnCEYwhCnShCnThCEUoxhCnThCEYpRjGMYxSikl5p/wAFj/ijN8OP2a7fw5o7Muu/GXxFb+BpXUmOe38NaeZPEviO8RYDHJI92ILHw9NujuFmttbkicLJJBKPym/Y/wD+Clf7Bn7AX7KPjHUP2k/2jvh94V8bX/xT17VX+Fmh3reMvjLcQ/8ACMeEtL0m3Hw08KJq3iy3sL6fS7yTT/EGr6dpnhmKK5DahrVkIrtoP5dv+Cvn/Bxh8a/+Ci3iLQfC/wAGfBv/AAzt8CfA0Wtp4etHu7HxB8VfEd5ryWlnqut+JfFEES2Ph5Z7GytrfT9G8LW8cmliS4E/iHWnkS5i/JX/AIJ6fst+J/2+/wBt74Cfs1pf3uz4qfEG0Xxz4gdri51DS/AHh+3vPGHxI17z2d55r+w8E6Dr02lGSeGOfW/7LtZr20F0txH87XyRVs3q5pXrKGHp4X2VOjBPmvJRnXqzk7pc3IopRTbS72PyqXh9j8T4s1vEXMszwry3AcMvh7I8po0608TT+txhXzTHYmvNxoUHPExnClRoU606lHlnVrU7Qpn+yFG6yxxyJkrIiuuQQSrqGXI6g4I46g8V+Lkn/BxT/wAEZ4HeKX9tbQ1eIsjgfBz9otlDIPmAdPhAyMBjgqxB4AJJFftJGioqRoAqIqoijoqqAqgZ5wAAOTX+Xr/wbf8A7GH7Mv7c/wC3Z8Y/hN+1Z8MLP4s/D3w/+zR4+8f6L4dvvEvjDwvHaeNNO+LPwf8ADljqy3/gfxH4Y1e4lt9C8T+IrdLOa+msh9sa6a3+0W1vLDjhMPQq08TVrOry0FGSVNx5mnzX0knd6K2q6n6DRpU5xqzm52p2doWu07907vbt1P7YB/wcY/8ABGI8D9tjRM+n/Cmf2jvTP/RHvSv2B+GPxG8GfGD4deAfi18ONbTxL8PPij4J8LfEXwH4jistS02PX/BvjbQ7DxL4Y1qPTtZs9O1ewTVdE1OxvlstV0+x1K1WcQX1na3UcsCfkIv/AAbqf8EZkUKP2J9BIXOC/wAYP2iZH5OeXk+LzO3J43McdBgcV+hfxH+JP7OH/BOz9k2bxd4vvrT4Vfs3fsx/C7wz4X0eyW41HWJdG8IeD9L0rwZ4C8E6B/al7fa34j16+S30Pwp4btLzULzV9b1a5sorq9muLia6qZRw0uWOFWIc5SSaqqOt1aKio6t82/SwpKk42oqq5PRqaWt9krdbn1XXBeJ/hJ8KfHTxS+N/hj8PfGMsDyPBJ4q8F+G/EMkLyqFkeJ9X028aNpF+V2QguvDEjiv5f7z/AIO3/wBjp7W78SaB+yL+2xq/w+sLyKwvfGtx4Q+F9hYWd1J5Sm2vHtvifqujWd35s8KJa3PiCKU+bF5wt3cR1+xX7Df/AAVr/ZL/AOCgfwC+K/x6+Al347EHwO0281L4r/DDxn4d07Q/ij4Pji0TWtf0oXGmWWv6x4X1O38U2HhzWv8AhGNV0bxbqGj391pt/YXV/Yahp2pWlnVTCV4R5qlF8t0tVCSTbSSavK120ldbvdEV8DTr0vZ4vCUMRSdk6eJoYfE0m9lenXo4invprTfqfR+v/Cn9h3wp4u8D+BPFfwz/AGV/D3jr4m3er6f8OPBuu+CfhPpnivx7faBpF1r+vWvg3w9faXDq3iWbRNCsbzWNYTR7S8Om6ZbT3175FtG0g9t8M/B34R+C2dvB3ws+HHhNpMb28M+B/DOgs+0EDedL0u1LYBIGc4BOK/zHNP8A+CwXw8v/APgvTpX/AAVJ8Z+HPjj4h+BnhnxZ4pg8L/Dq4Ggar8VfD3w9vvgd4u+FPh7w9o+jaj4zXwZo/wBj1zxJceKbnw9ZeMrfRYH1DXriC+nvrm4nuf7qf2hv+C0/7M37Nf7An7Pf/BRPxx8Ofj1qfwb/AGkfEHgvw34L8I+GvDvw+uvijo19468JeOfGOky+K9I1X4l6R4Vsra207wDq1vqLaV4x1meG9u9Niht7iKS6mtNKuXui6PJTjKVRJXjTpRtVab5ItKLuop6tq9nZ7I54ZBlODnTlhcnynD1HtPDZTlWGnGcrtqM8PltCab1bakru7bZ+wAAAAAAAAAAGAAOAABwAB0FWF6D6D+VeC/sy/H7wj+1T+z58Hf2kPAWleJND8F/Gz4f+HPiN4Y0jxha6XZeKNO0XxNYRahY2uvWmiavr+kW+pRQyqtzFp2tanaq+RFeTL81fn3+z/wD8FpP2Zv2i/wDgoN8WP+Cb3gz4d/HbSfjT8HdY+LOieJPF3ibQPh9a/C6/uvg7rJ0PxJLomq6X8StX8W3FvqF0PM0Rr3wXYSTW7K2ox6ZKwirBUqknUSg26Sbqbe6k2m3d9GmtLnaoSfNZfAve20S0/C1tD9f6kj7/AIf1r8U/23P+C737Gf8AwT+/a28Ffsi/tC+HvjVpviLxf4a8E+Mrz4o+HvDPg3WPhV4N8LeNdc13RE1vxRcSeP7Lx+1v4fPh7UdR1y28OeAPEOpNYrEmiWOtahLHYN5D+wt/wcYfslf8FAf2vdB/ZG+CHwW/aTttW8WWnjbUNB+I/irw58P7LwdBpXgXwxq/ifUNb8T2mmfEPVvEPhzRtVj0dtH0O4bTNQvJtd1jw5Yanp+lHVJpLDVYav7KU/Zy5HFVFLSzhvf4uyvbe3Qr2VRx5uV8tua+lrd9/wDgn9B1Sp0P1/oK/m4/af8A+Dnv9hH9n/47eMf2dvAXw5/aI/af8e+BNbu/Devav8DvC/g3UvAc3iDSWuIfEOjeH9b1vxxpev8AiW68O3ltNZalqGj+Ernw3PNHI2k6/qcKGU9h+w1/wco/sJftq/Hvwv8Asxjwj8c/2f8A4weOdVm8O+DLD4zeGfC1r4X8SeMIxcGHwRbeI/CvjDxFcaV4rvvsk1vp1l4n0XQbDUNVEPh+y1OfxDe6dpd5r9WrqHO6UuXlUul0rXu435lprt8jSVOfJfldrJ/K172vfbyP6HU6n6f1FS1EnU/T+oqWsTKXxL5Ekff8P61JUcff8P61JTj8S9f8zUKkj7/h/Wo6kj7/AIf1rSO8v8QElFFFWBYpyfeH4/yNNpyfeH4/yNA1uvVfmTVYqvVinH4l6/5mkfil6oVeo+o/nU9QL1H1H86nrcsKVeo+o/nSUq9R9R/OgCenJ94fj/I02nJ94fj/ACNVHaX+EC2nQ/X+gpqdT9P6inJ0P1/oKanU/T+ooj8MvRAS1JH3/D+tR1JH3/D+tarZei/ICSlXqPqP50lKvUfUfzplQ3f+Fk9FFFXT3fp+o6e79P1JU6H6/wBBT6YnQ/X+gp9alR+KXqhyfeH4/wAjU1Qp94fj/I1NQWWKmT7o/H+ZqGpk+6Px/ma1+2/8KAdU69B9B/KoKnXoPoP5VL+P5r9AFooorUD+cpOp+n9RUtRJ1P0/qKlr+dz+b1uvVfmiSPv+H9akqOPv+H9akoLfx/NfoFFFFBqTJ90fj/M1OnQ/X+gqBPuj8f5mp06H6/0FaL4o/wCA0XxR/wAA+lXqPqP50lKvUfUfzrQ0W69V+aJ6cn3h+P8AI02nJ94fj/I0HQTUUUUAFSp0P1/oKiqVOh+v9BVfYf8AiQD6Veo+o/nSUq9R9R/OtgW69V+aJ6enU/T+oplPTqfp/UUHQS0UUUAOT7w/H+RqaoU+8Px/kamqvsP/ABIr7D/xIenU/T+oqWok6n6f1FS0P4V6suHw/NhViq9WKJfDH0ZYUUUVqtl6L8jSns/X9ByfeH4/yNTVCn3h+P8AI1NVw+L5M0JI+/4f1qSo4+/4f1qSrXxy9EAVYqvVip+38/0NfsfL9Qr4i/4KHfsSeD/+CgX7LPjn9nfxRqY8N6rqFxp3iv4d+M/sn29vBXxG8OC6bw9r0llvjN5p08F7qfh7X7WN4rm58N67rENjcWl/Ja3cH27Ukff8P61tQq1KNWNalJwqUqkZwkt4yi7p66Ps09Gm0002VSqTpVaNWnJxqU2pwkt1KOqfZ+aejTaas2fxRfAv4u/8F5P+CS/hz/hmmf8AZA1b9qL4OeFL3UYvAOpaF4C8f/GPRtE0u6vZ7sJ4N8efCO7XVtL8L395cXF/a+HfiJoaavpRuhZWun+H4h/Z4q+Mf2cv+Cv/APwXD+Mfwutv2tPhFf8A7In7MHw91h7+6sdX8H678NLTRba/a3i1zVdC8EeP9R1D4jePPiPrOj250vRdU1W0i8HaHumKyeHbXUtRh1f+2ulXqPqP517f9ttTliKeX4GljZKV8ZCNVzU5pqVWNKU3RjUldtySerb1u+b2f7XalKtTwODp4uSlfFRjU5lKSalUjTcnSjUd2+ZJ6u+ut+e8D+DPDfw48FeEPh54N02LRvCHgPwv4f8ABnhXR4Cxg0rw34X0m00TQ9NhLkuYrHTLG1tYyxLFIgWJOTXUUUV4qbcrtttyu29W222231bbbb6tt9TyG222222223q22222+rbbbfdsKsVXqxVy+KPqxBRRRVlQ+L5MsUq9R9R/OkpV6j6j+dRD4fmy/tv/AAonoooqyyZPuj8f5mnU1Puj8f5mnUATr0H0H8qWkXoPoP5UtBUPi+TCpk+6Px/mahqZPuj8f5mtZ7L/ABI2HVYqvVilU6fP9AFXqPqP51PUC9R9R/Op6mW0f8IBUqdD9f6CoqlTofr/AEFXL4V8gH0UUUQ+H5sAqxVerFWaf8+/mFFFFBoWY+q/T+lT1BH1X6f0qegAqdeg+g/lUFTr0H0H8qAPwr/4Lj/8EldR/wCClnwi8F+J/hHq2jeHP2mfgY+t3Hw+m164fTdB8eeF9e+xXGvfD7WdYgikk0e/e/0vT9X8Ga7dR3GnaXq6ajpt+un6f4mv9d0j8ffh5/wU7/4OJv2WfDGn/A/4r/8ABOPxv+0H4m8IWUPhzSPibf8AwH+NHjnWtaXT41s7R9f8dfBTV9S8AfEC4hhhiV9a0qW11XVwG1DWNX1S/uptRl/tXp6dT9P6ivRoZg6dCOGr4ahjKNOUpUo1ueMqTlrJQqU5RlySeri7q97abehSxXJQjSq0aWIpwvKEanMnBt6qM4NS5W9XF3V/w/jO/Yo/4Jtf8FFP+ChP/BQHwT/wUd/4KpeFj8LvCnwr1Pw14i8A/CbWNOg8O6vrF74F1CbXfh14G8PfDdtQ1bVfAfw08K+KriXxT4hbx5cN4k8U35ubKa11yTxNrXiTTP7NqKKwxeLqYucHKNOnClBUqNGlFxp0qad+WKbbbb1lJttsmtXliHBuMIRhBQp06atCnFa2im299W3q2WKKKK5TEkj7/h/Wpk+8Px/kahj7/h/Wpk+8Px/kaa3XqvzNV8Hyf6k1fnp+y3/wTO/Zy/ZO/aG/aT/al8Fv448afGz9pzxRf694r8b/ABQ1+08Wa14V0nVr5Na1fwX4H1BdJ0+80rwtqfiFV1S8tryfUb6aDT/DukSXz6Z4b0qCL9C6K6o1JwjUhCcoxqxUaiTspxUlJRlpdpSSdrpNpXutB0pSippSaU0lJJ25kndJ91eztfda3J16D6D+VLSL0H0H8qWsYbP/ABMoKmT7o/H+ZqGpk+6Px/masCaPv+H9akqOPv8Ah/WpK0X8P5P8wJk+6Px/madTU+6Px/madVrZei/IAqVOh+v9BUVSp0P1/oKZutl6L8kPpV6j6j+dJSr1H1H86Bk9WKr1Ypx+Jev+YCr1H1H86/i//wCDrH/gmhceLfDeif8ABSX4WafGdT8DaT4b+GX7SOh6dp1rDLqHhJ9VnsPAPxauJ7ZILm/1Dw9qWrWHw88TXF6dSum8N3fgh4RY6L4Q1KUf2gL1H1H86474m/DfwV8Y/hz48+EvxI0ODxN8Pvib4P8AEngLxt4euZrq2h1rwr4t0i70LXtMa6sZ7a+szeaZfXMMd7YXVrfWcjpc2Vzb3UUUyduCxEsLiFVjqlLlnH+anLSa9bax7Siu7NqFV0asZrZO0l3i/iXr1Xml3P8ALa/4ITf8FL5f+CY37cHhrx34qF/efAz4uWdv8IfjtpUF+bK0svC2u6zpz6X8QzFJDdQ3d/8ADHVlfxDFCsMd3c6JJ4j0u3vYW1fzF/1u7TULK/tbHVtG1Cy1XRdYsrXVNH1XTrqG90/U9NvolurLULG8t5Jbe5sry2ljuLS5hkeC5t3iuIHkgljdv8e//grh/wAE1fHX/BM39q/xL8K7uLxPr3wX8UvN4s/Z/wDihrtvayHxz4ElWB59N1TUdMgtdKk8ceBNRuv+Ea8aW0NlpE01xFp3iq30TTdB8WaAkv8AXj/wa+/8Fk1+OngPTP8AgnV+0v400eD4s/DDw/pWnfsr6/qqSWWqfEn4c+H9LvFu/hhf6gd1pqPir4fafp1hJ4VecQ3mreDYZbAGebwmqXf28JxqQjUg1KE4qUWuqav8n0aeqaaeqPoIyjOKlF3jJJprqn/Wq6NNdD+zZNQjVVXy2llGAQiFmJGeh4B54PJxxjjinFNQuAfIlTT13Z8zAmucEgEKjbI4eM872K8EAdKx4pnyGDboztZSpR1beoYNuUucEEEHdzz3BretrguvzEgEDAyR68EbsHA68Z6fjVk+iKLOnWVtC6uVMk+CHvbiUz3chPUtOy7lU9PKikjjxwVYFgdpoW2BkCvuc4IJAZiQDkLhckMc7ht9skA4xO5TtznIwQcEEH/P/wCo15f8dfjZ4U/Z4+BnxZ+Ofj/U7PSPB3wg+H/i34ia1qGoTrb2jWvhbSLnVIrISfekn1O8trXTLO3ixPe313badD+/u4qYH8D/APwWJ/4Ol/2nNY8bfHr9j79j/wAIW/7Onh3wL44+JfwX8WfHI+IZte+MniiPwtr2reCtS1LwJdWdrpWnfCoXTWGoS6dqOn/274qsIp7W/wBJ8QaRfwxSD+MDxD4o8R+Nde1TxL4s13WvFPibxBfT6jrXiLxFqt/rWu61qV5IslzqGravqdxdX+p31y4LTXV9cT3M8jF5JGkINXPHXivW/iB418YeN/EM5n1rxr4o1/xfrMvm+a02q+INVu9Y1FyzuXctc3s8hLgOS2XUHgf1g/8ABI//AINifiX+0ND4c+PH7fkHib4LfA7U9J0/X/Bnwj0PVrfR/jT8R4rw217ZXHi+OfTdUX4Z+B9Q06SSO5sLlrb4kanHPNDFp/g2JrLW7nKtXpUIOdWajHp1lJ9oxWsn5LZatpakTqQpx5ptJdO7fZLdv0+bR+DX/BP3/gmT+1f/AMFIPiZZeBv2fvh7ql34U0/WtLsPiN8YtZtZbD4W/C3TL6aD7RqHiXxHObe1vNTg095dTsPBeiS6h4z162gkfSNDu7a3vLm2/wBLT/glR/wR1/Zz/wCCWnw/vYPCBtPir8fvFkVxF8Qv2h/EPhPSND8U6jply2nSN4I8E2MM+r3ngX4bRXOk2OpyeGI/EWtXesa3GNW8Q63qzWeh22i/oV8Af2efgh+y78NtF+D37Pfww8I/CX4baBvlsPC3g/S49PtZr6aO3hvNa1i7Yzan4i8SamttbtrHifxBfap4h1maJLjVdTvJx5le1V87jMwqYm8IXp0f5b+9P/G10/uR93a7kzzK+JlVvGPuw7dZf4n+i073FXqPqP51/klf8Eev+CZ2m/8ABVb9qn4kfs9ap8YtQ+CFt4N+DXi/4wjxXpvgiLx7cag+heP/AIeeC10A6Vc+LPCUdpHdf8LAOotf/b7nadJS2+wt9oM8X+toOCD6V/F9/wAG6P8AwSJ/b/8A2B/25fi78Zv2qfgfZfDb4c+Kv2ZfHHw70LxBb/FP4R+N5L7xdrXxa+DfinTdKOj+AvHXifWbVZ9D8Ja9dvf3enwadC9iLeW8F1d2sU1YGsqOHxslUjCpyQdO7jdyXN8MZfE1fazHh6ip0q7UlGVouN2rtpPZPffsy/8ADj/gz68G/D/4geBfHX/DfXjDV/8AhCfGPhnxcmlH9nrR7FdRfw3rVjrAsTeN8YL4WgvPsf2Y3P2O6+ziUyi3m2+W379/8Fav2hv2A/2bf2WW8ef8FCvhn4J+Nnw2TxhZR/Dn4QeKfh34W+J+teNvitHoPiAaXF4G8PeL4v7E0nxDY+GZ/FBufGGoahoVloWh3WqWk2tRz6xaaZqv6f1+EP8AwX2/4JYfEP8A4KefsyeB9L+CXiDS9O+OHwE8Xaz478CeGPEupPpHhj4iWGu6LHpXibwbcaszGw0DxJdiw0e/8J+IdXhl0mC9sLrQtVuNF0zxHe+ItHmliJ4mtS+tVmoQl8cVGm43T+1BJq7UU5bpNtW1FCrKrOPtpvlT+JWi1fzik1dpJvon0PzP+GX/AAVS/wCCg3x5/Zrj+GP/AATF/wCCD0Xhb9m648Jaj4Z+HOsfFTVrCP4Ja54I1sarb6sukeB9V8NfBzwP4v0/VZJ9Yj1qDR/iF4t0m81efUF16bVp76a3vPmD/gzIuGbxp/wUPgwyJL4e/ZjnMavOIl8rUfjokSmNnaKQxrPKI5nLyKHlET7JZM/WX7JPwr/4OcLr4EfDr9gXxj4I/Zz/AGQvgZ4V+Hul/B9f2udR1T4f+P8A47eCfhVodjb+HLOz8HaR8KPj14p0TWPHemeDohonhbUrn4f+FrlpLWz1HUviFoniRW8VL6h/wbz/APBLr9s7/gmV+0d+2x4e+PPw3sv+FMfEzSfDem/DD416f41+HOoReNH+FPjjxXaeH7q58DaB458Q+MfCz+OvC/jm68U21prOl40ddIudK1vULbVXs4L/AL6kqUcPi4Rlh05WlFU60qk6iU1705TbvNrXljeS1b0sdMnBU6sU6avZx5ZubkrrVtt3l1std29LH5c+BLS0g/4PJLy1htrdLb/hcnxFvPJjhjWE3Vz+w34l1K5uGjVQpnk1GV7uSUgO92WnZmlLOf1X/wCDwXj/AIJjfB8Af83ufC8dwFH/AApP9ovk47A4BHofTOfmH/goT/wS6/4Ko/C3/gs/L/wVC/4Jz/Bj4e/HsavLoHjfS9K8X+N/h34d0jwz4pT4O23wT8Z+E/GugeOfil8K9b1nT9e0qDVNesNU8I60PJh8QRWn2zS9S0ZJLv8AWD9t/wDYN/as/wCCtP8AwSQ8F/B79pvRPh3+z7+3NZa3onxhbwvouttqHwj8PfFjwdqnjLw7Y6Ffat4c1v4lTr4a8T/DXxLqUJm0zxB4tm8Pa5rVldS3erjR7i2uZnUp+1wNf2sHCEKcJrnTnGXLJNyhuktm3t5g5R56E+aPLFRT11Ts91ukurPsX/gjaVP/AASq/wCCf+11cD9lf4RqSucB08L2SSIc8ho3Vo3B6OrDtX8nn/BKa7jvP+Dqz9uueJSE/wCFkft8WwJZW3Pp/wAT57CYgrwVMtu7KD86BirZwK+tP2Dfhx/wdKfs4fB7wZ+xJoXwT/Zh8AfCPwzHfeEPBv7RPxm8TfC7x94g+DXhG6ubmSKfw5Z/DD43aheeKbTQDPdX3hGw8YfB7xteiaey0fWmh0K3js9L6P8A4JV/8EUf20v2Ev8Agsn8RP2gPiF9t+K37Os/gz4radY/tMeI/Ffw9s/F3xP8VfETT/Des3ev658OdP8AHnijxtpmo6n4ofxBb3s+oWoWWS1GpXEqpexCklTp/XpOtRbrU6ns4wqKTac5SV+il7ySjdyer2VwtGPt25wfPGXKlK7d5N/fra2716H5lf8ABx38LdJ+OX/BfT9kr4J6/dXtloPxh8Dfsh/CzWbzT2iS/stK+IPx38c+EtRutPe4ingW9gs9WnltGmhljW5WMtGw6f3W+Av2TP2Kf2YxffEn4cfs4/s1/AqXwj8P9b0DV/iH4S+FPw4+H2oaR8NI4bPV/E2n674x0vQ9Mvx4WaPw9Zatr41bUpLKZtLTUdSZ5IWmr+cX/gp9/wAErP23P2k/+C5X7FH7aHwj+Eml+KP2c/g9rv7IF38QfG9z8Rvhvod1otp8Kfj5q3jjx7IvhHxB4s0vxZqv9k+GLyK/hTSNFvpNRdvsmmLeXoNun9Sfxu+FGifHj4KfGH4HeJb7UtL8OfGb4W+P/hR4g1PRnij1fTtE+InhPV/CGq32lSTxywR6laWGsT3Fi80UsS3UcTSRugZTFeqnQwkI1LRVKKqcktY3lBPmUWtVG7Sl22IqTThRipaKK5uV7apapPdK+jP5BPhV/wAFm/2VvBn7QXxV8K/8ERv+CJuq/HvxNc21j4b8cfFb4LeBrD4Kafq3h6w1a5g0XWLjQfh78IfHd/ofw21bVUF5p1944vvhq+o3K293ruj6fd21s8f4r/tB+Pv2wvid/wAHBv7CnxJ/bc/Zo8Ifso/Gvxf+0r+w7qtp8OPBg01xd+BLf45+HtK8G+KfEmv6X4j8TyeKvF09vpdxoGr67qN/aX4j8N2WkDRtF0/SLDTbL9E/2J/+Cd3/AAcQ/wDBGv4v/HXw/wDsYfs9/s9ftIfDb4rSeGNL1fxT4w8c/DUeAPFtv4Ll1iTwZ4ysNH1342fBH4s+Ete0ay8V+IbHUtEvJDoc0uoX0DR+Jxp+g69H23x6/wCCJf8AwV78Rf8ABRD9kD/gol8RNQ8BftcfFE/GH4KfGz9orRPh3rHw8+E3hP4JJ8HfiH4Lv9I+Evw5HxD8deGLjx1oFl4C8PQWema1Z6Lo88uq2mpya7/bOsX83irxD3RlRhOXLOk4ypOMakq0p1Zvl2lzPlivW13ZJJ3R0pwi370bONlJzbk9Ot9F8/kt0f3dp1P0/qKlqJOp+n9RUteOcMviXyJI+/4f1qSo4+/4f1qSnH4l6/5moVJH3/D+tR1JH3/D+taR3l/iAkoooqwLFOT7w/H+RptOT7w/H+RoGt16r8yarFV6sU4/EvX/ADNI/FL1Qq9R9R/Op6gXqPqP51PW5YUq9R9R/OkpV6j6j+dAE9OT7w/H+RptOT7w/H+Rqo7S/wAIFtOh+v8AQU1Op+n9RTk6H6/0FNTqfp/UUR+GXogJakj7/h/Wo6kj7/h/WtVsvRfkBJSr1H1H86SlXqPqP50yobv/AAsnoooq6e79P1HT3fp+pKnQ/X+gp9MTofr/AEFPrUqPxS9UOT7w/H+RqaoU+8Px/kamoLLFTJ90fj/M1DUyfdH4/wAzWv23/hQDqnXoPoP5VBU69B9B/Kpfx/NfoAtFFFagfzlJ1P0/qKlqJOp+n9RUtfzufzet16r80SR9/wAP61JUcff8P61JQW/j+a/QKKKKDUmT7o/H+ZqdOh+v9BUCfdH4/wAzU6dD9f6CtF8Uf8Bovij/AIB9KvUfUfzpKVeo+o/nWhot16r80T05PvD8f5Gm05PvD8f5Gg6CaiiigAqVOh+v9BUVSp0P1/oKr7D/AMSAfSr1H1H86SlXqPqP51sC3XqvzRPT06n6f1FMp6dT9P6ig6CWiiigByfeH4/yNTVCn3h+P8jU1V9h/wCJFfYf+JD06n6f1FS1EnU/T+oqWh/CvVlw+H5sKsVXqxRL4Y+jLCiiitVsvRfkaU9n6/oOT7w/H+RqaoU+8Px/kamq4fF8maEkff8AD+tSVHH3/D+tSVa+OXogCrFV6sVP2/n+hr9j5fqFSR9/w/rUdSR9/wAP61Ud5f4hdYf4f0JKVeo+o/nSUq9R9R/OrNCeiiimt16r8wCrFV6sVpL4o+rAKKKKsqHxfJlilXqPqP50lKvUfUfzqIfD82X9t/4UT0UUVZZMn3R+P8zTqan3R+P8zTqAJ16D6D+VLSL0H0H8qWgqHxfJhUyfdH4/zNQ1Mn3R+P8AM1rPZf4kbDqsVXqxSqdPn+gCr1H1H86nqBeo+o/nU9TLaP8AhAKlTofr/QVFUqdD9f6Crl8K+QD6KKKIfD82AVYqvVirNP8An38wooooNCzH1X6f0qeoI+q/T+lT0AFTr0H0H8qgqdeg+g/lQAtPTqfp/UUynp1P0/qKDX7Hy/UlooooKWy9F+RYooooGSR9/wAP61Mn3h+P8jUMff8AD+tTJ94fj/I01uvVfmar4Pk/1JqKKK3FT6/L9Sdeg+g/lS0i9B9B/KlqIbP/ABM0Cpk+6Px/mahqZPuj8f5mrAmj7/h/WpKjj7/h/WpK0X8P5P8AMCZPuj8f5mnU1Puj8f5mnVa2XovyAKlTofr/AEFRVKnQ/X+gpm62XovyQ+lXqPqP50lKvUfUfzoGT1YqvVinH4l6/wCYCr1H1H86nqBeo+o/nU9aR3l/iA+Cf+Cj3/BPj4P/APBSf9mrxH+z78VZZfDupfaoPEnwy+J+laZYan4l+F3j3Tgw0/xFpNvfeXHf6Zf273GheLdAN3p//CQeGtR1CytNU0TWV0jxBpH+WZ+0j+zL+1h/wTC/agk8E/EGz8U/Cj4vfC3xbH4g+G3xM8KTazp2j+J10G/jvPD3xN+EnjM2WlPquh3JFpfWF9bJb6rpdyX0TxHpmi69aanoll/sU181ftWfsd/s5ftufCjVPg1+0v8ADHQviR4NvvNn02S+jez8SeEdXeNUi8R+B/FVi0Gu+EvEEGxF/tHRr22N7aiXTNUjv9Iur3T7n1sBmMsJ+7qJzoSd7L4qbb1lC+6f2oXSb1i1K9+/CYl0k4yvKm3t1i3a7j5PqvmrPf8AA3/gkT/wdBfAn4++GPAHwG/b78RW3wX/AGhLWxXQm+OmuPpWl/BL4ozWEBe21nxRrBm0y2+GnjPV4o/Jv4dTtU8H6hrDXF/a63ob6lHolh/Vj4S+K3ww8b2FlrPgb4m/D3xrpN1bx3FnqnhDxr4b8SaffQXKLJBLbXOjalcxTpKitJGYZGDxEScI4av4tvjF/wAGefwR1rUrm7+Af7Z3xP8Ah1pUmJYdD+K3wv8ACvxcuVuBjCL4h8K+Ifg2IbQfOER9Bu5gpAmluD5jS/PVh/wZ1fFC2vCqf8FBPC1jaeadlxY/ADX/ALQYzj961iPi/bWwkI3Zi+1Opzt88LgD3o5ngZK6rpaXalCpFr1XI/wbPRWKoNX9ol5NST/J/mf26/H39uz9kH9lbwJ4i+IPx7/aK+EngDQvC9lcX2oWN7478OXviu8e33R/2ZofgrTdUvPFev6tdTRy29rpWkaZcXs08Loifu3ZP4Gv+Cwv/BZv4uf8FsPGHhX9g/8A4J5/Bj4ua18F08UQ+Irq20zS9Tl+KHx51TTrcWthfeK/CWifarXwh8LvBt7eSapDHr+pXUD3MVn4s8XS6LNpcFtYfoN8JP8Agzy+Auk6lHffHv8AbN+L/wAS7QFZJtP+GHw58IfCO4llU52yaz4t1r41zNE4AWV4LG0u2DSNFdQSFJI/6aP2Ov2Dv2U/2Cvh6Phx+y98IvD/AMO9NuliPiPxGFl1nx/43uoZbi4jvfG/jvV3u/E3iV4Li7u5NOs7/UG0nREuprTQdO0uxK2q41s3w0EvY81acvh0lCC83KSTt5Rjd91uZ1MZTivcvOXTRxivVvX5JfM/B3/gkJ/wbX/DH9jvxD4N/aT/AGwdT0H42ftI6BPovirwN4C0mK6f4UfA7xfYXdvqljrkN5czJdfE3x94fura2k0fXtSsdN8K+GdT+0XmjaDret6f4f8AG1p/VRUC9R9R/Op68KtXq4ifPVlzPZLaMV2jFaJfi3q22edUqTqy5pu76LZJdkui/F7ttj06n6f1FS1EnU/T+oqWsSAqdeg+g/lUFTr0H0H8qAFp6dT9P6imU9Op+n9RWlPr8v1Kj8MvREtSp0P1/oKiqVOh+v8AQVoarZei/ImTqfp/UVLUSdT9P6ipaBhU69B9B/KoKnXoPoP5UALUkff8P61HUkff8P61S+CXqgJKlTofr/QVFUqdD9f6CtVsvRfkjWXwr5EydT9P6ipaiTqfp/UVLTJl8S+RJH3/AA/rUlRx9/w/rUlOPxL1/wAzUKkj7/h/Wo6kj7/h/WtI7y/xASUUUVYFinJ94fj/ACNNpyfeH4/yNA1uvVfmTVYqvVinH4l6/wCZpH4peqFXqPqP51PUC9R9R/Op63LClXqPqP50lKvUfUfzoAnpyfeH4/yNNpyfeH4/yNVHaX+EC2nQ/X+gpqdT9P6inJ0P1/oKanU/T+ooj8MvRAS1JH3/AA/rUdSR9/w/rWq2XovyAkpV6j6j+dJSr1H1H86ZUN3/AIWT0UUVdPd+n6jp7v0/UlTofr/QU+mJ0P1/oKfWpUfil6ocn3h+P8jU1Qp94fj/ACNTUFlipk+6Px/mahqZPuj8f5mtftv/AAoB1Tr0H0H8qgqdeg+g/lUv4/mv0AWiiitQP5yk6n6f1FS1EnU/T+oqWv53P5vW69V+aJI+/wCH9akqOPv+H9akoLfx/NfoFFFFBqTJ90fj/M1OnQ/X+gqBPuj8f5mp06H6/wBBWi+KP+A0XxR/wD6Veo+o/nSUq9R9R/OtDRbr1X5onpyfeH4/yNNpyfeH4/yNB0E1FFFABUqdD9f6CoqlTofr/QVX2H/iQD6Veo+o/nSUq9R9R/OtgW69V+aJ6enU/T+oplPTqfp/UUHQS0UUUAOT7w/H+RqaoU+8Px/kamqvsP8AxIr7D/xIenU/T+oqWok6n6f1FS0P4V6suHw/NhViq9WKJfDH0ZYUUUVqtl6L8jSns/X9ByfeH4/yNTVCn3h+P8jU1XD4vkzQkj7/AIf1qSo4+/4f1qSrXxy9EAVYqvVip+38/wBDX7Hy/UKkj7/h/Wo6kj7/AIf1qo7y/wAQusP8P6ElKvUfUfzpKVeo+o/nVmhPRRRTW69V+YBViq9WK0l8UfVgFFFFWVD4vkyxSr1H1H86SlXqPqP51EPh+bL+2/8ACieiiirLJk+6Px/madTU+6Px/madQBOvQfQfypaReg+g/lS0FQ+L5MKmT7o/H+ZqGpk+6Px/ma1nsv8AEjYdViq9WKVTp8/0AVeo+o/nU9QL1H1H86nqZbR/wgFSp0P1/oKiqVOh+v8AQVcvhXyAfRRRRD4fmwCrFV6sVZp/z7+YUUUUGhZj6r9P6VPUEfVfp/Sp6ACp16D6D+VQVOvQfQfyoAWnp1P0/qKZT06n6f1FBr9j5fqS0UUUFLZei/IsUUUUDJI+/wCH9amT7w/H+RqGPv8Ah/Wpk+8Px/kaa3XqvzNV8Hyf6k1FFFbip9fl+pOvQfQfypaReg+g/lS1ENn/AImaBUyfdH4/zNQ1Mn3R+P8AM1YE0ff8P61JUcff8P61JWi/h/J/mBMn3R+P8zTqan3R+P8AM06rWy9F+QBUqdD9f6CoqlTofr/QUzdbL0X5IfSr1H1H86SlXqPqP50DJ6sVXqxTj8S9f8wFXqPqP51PUC9R9R/Op60jvL/EAVKnQ/X+gqKpU6H6/wBBVmsNn6/oh9OT7w/H+RptOT7w/H+Rqo7S/wAJZNViq9WKr/n38wFXqPqP51PUC9R9R/Op60AenU/T+oqWok6n6f1FS0AFTr0H0H8qgqdeg+g/lQAtPTqfp/UUynp1P0/qK0p9fl+pUfhl6IlqVOh+v9BUVSp0P1/oK0NVsvRfkTJ1P0/qKlqJOp+n9RUtAwqdeg+g/lUFTr0H0H8qAFqSPv8Ah/Wo6kj7/h/WqXwS9UBJUqdD9f6CoqlTofr/AEFarZei/JGsvhXyJk6n6f1FS1EnU/T+oqWmTL4l8iSPv+H9akqOPv8Ah/WpKcfiXr/mahUkff8AD+tR1JH3/D+taR3l/iAkoooqwLFOT7w/H+RptOT7w/H+RoGt16r8yarFV6sU4/EvX/M0j8UvVCr1H1H86nqBeo+o/nU9blhSr1H1H86SlXqPqP50AT05PvD8f5Gm05PvD8f5GqjtL/CBbTofr/QU1Op+n9RTk6H6/wBBTU6n6f1FEfhl6ICWpI+/4f1qOpI+/wCH9a1Wy9F+QElKvUfUfzpKVeo+o/nTKhu/8LJ6KKKunu/T9R0936fqSp0P1/oKfTE6H6/0FPrUqPxS9UOT7w/H+RqaoU+8Px/kamoLLFTJ90fj/M1DUyfdH4/zNa/bf+FAOqdeg+g/lUFTr0H0H8ql/H81+gC0UUVqB/OUnU/T+oqWok6n6f1FS1/O5/N63XqvzRJH3/D+tSVHH3/D+tSUFv4/mv0Ciiig1Jk+6Px/manTofr/AEFQJ90fj/M1OnQ/X+grRfFH/AaL4o/4B9KvUfUfzpKVeo+o/nWhot16r80T05PvD8f5Gm05PvD8f5Gg6CaiiigAqVOh+v8AQVFUqdD9f6Cq+w/8SAfSr1H1H86SlXqPqP51sC3XqvzRPT06n6f1FMp6dT9P6ig6CWiiigByfeH4/wAjU1Qp94fj/I1NVfYf+JFfYf8AiQ9Op+n9RUtRJ1P0/qKlofwr1ZcPh+bCrFV6sUS+GPoywooorVbL0X5GlPZ+v6Dk+8Px/kamqFPvD8f5GpquHxfJmhJH3/D+tSVHH3/D+tSVa+OXogCrFV6sVP2/n+hr9j5fqFSR9/w/rUdSR9/w/rVR3l/iF1h/h/QkpV6j6j+dJSr1H1H86s0J6KKKa3XqvzAKsVXqxWkvij6sAoooqyofF8mWKVeo+o/nSUq9R9R/Ooh8PzZf23/hRPRRRVlkyfdH4/zNOpqfdH4/zNOoAnXoPoP5UtIvQfQfypaCofF8mFTJ90fj/M1DUyfdH4/zNaz2X+JGw6rFV6sUqnT5/oAq9R9R/Op6gXqPqP51PUy2j/hAKlTofr/QVFUqdD9f6Crl8K+QD6KKKIfD82AVYqvVirNP+ffzCiiig0LMfVfp/Sp6gj6r9P6VPQAVOvQfQfyqCp16D6D+VAC09Op+n9RTKenU/T+ooNfsfL9SWiiigpbL0X5FiiiigZJH3/D+tTJ94fj/ACNQx9/w/rUyfeH4/wAjTW69V+Zqvg+T/UmooorcVPr8v1J16D6D+VLSL0H0H8qWohs/8TNAqZPuj8f5moamT7o/H+ZqwJo+/wCH9akqOPv+H9akrRfw/k/zAmT7o/H+Zp1NT7o/H+Zp1Wtl6L8gCpU6H6/0FRVKnQ/X+gpm62XovyQ+lXqPqP50lKvUfUfzoGT1YqvVinH4l6/5gKvUfUfzqeoF6j6j+dT1pHeX+IAqVOh+v9BUVSp0P1/oKs1hs/X9EPpyfeH4/wAjTacn3h+P8jVR2l/hLJqsVXqxVf8APv5gKvUfUfzqeoF6j6j+dT1oA9Op+n9RUtRJ1P0/qKloAKnXoPoP5VBU69B9B/KgBaenU/T+oplPTqfp/UVpT6/L9So/DL0RLUqdD9f6CoqlTofr/QVoarZei/ImTqfp/UVLUSdT9P6ipaBhU69B9B/KoKnXoPoP5UALUkff8P61HUkff8P61S+CXqgJKlTofr/QVFUqdD9f6CtVsvRfkjWXwr5EydT9P6ipaiTqfp/UVLTJl8S+RJH3/D+tSVHH3/D+tSU4/EvX/M1CpI+/4f1qOpI+/wCH9a0jvL/EBJRRRVgWKcn3h+P8jTacn3h+P8jQNbr1X5k1WKr1Ypx+Jev+ZpH4peqFXqPqP51PUC9R9R/Op63LClXqPqP50lKvUfUfzoAnpyfeH4/yNNpyfeH4/wAjVR2l/hAtp0P1/oKanU/T+opydD9f6Cmp1P0/qKI/DL0QEtSR9/w/rUdSR9/w/rWq2XovyAkpV6j6j+dJSr1H1H86ZUN3/hZPRRRV0936fqOnu/T9SVOh+v8AQU+mJ0P1/oKfWpUfil6ocn3h+P8AI1NUKfeH4/yNTUFlipk+6Px/mahqZPuj8f5mtftv/CgHVOvQfQfyqCp16D6D+VS/j+a/QBaKKK1A/nKTqfp/UVLUSdT9P6ipa/nc/m9br1X5okj7/h/WpKjj7/h/WpKC38fzX6BRRRQakyfdH4/zNTp0P1/oKgT7o/H+ZqdOh+v9BWi+KP8AgNF8Uf8AAPpV6j6j+dJSr1H1H860NFuvVfmienJ94fj/ACNNpyfeH4/yNB0E1FFFABUqdD9f6CoqlTofr/QVX2H/AIkA+lXqPqP50lKvUfUfzrYFuvVfmienp1P0/qKZT06n6f1FB0EtFFFADk+8Px/kamqFPvD8f5Gpqr7D/wASK+w/8SHp1P0/qKlqJOp+n9RUtD+FerLh8PzYVYqvViiXwx9GWFFFFarZei/I0p7P1/Qcn3h+P8jU1Qp94fj/ACNTVcPi+TNCSPv+H9akqOPv+H9akq18cvRAFWKr1Yqft/P9DX7Hy/UKkj7/AIf1qOpI+/4f1qo7y/xC6w/w/oSUq9R9R/OkpV6j6j+dWaE9FFFNbr1X5gFWKr1YrSXxR9WAUUUVZUPi+TLFKvUfUfzpKVeo+o/nUQ+H5sv7b/wonoooqyyZPuj8f5mnU1Puj8f5mnUATr0H0H8qWkXoPoP5UtBUPi+TCpk+6Px/mahqZPuj8f5mtZ7L/EjYdViq9WKVTp8/0AVeo+o/nU9QL1H1H86nqZbR/wAIBUqdD9f6CoqlTofr/QVcvhXyAfRRRRD4fmwCrFV6sVZp/wA+/mFFFFBoWY+q/T+lT1BH1X6f0qegAqdeg+g/lUFTr0H0H8qAFp6dT9P6imU9Op+n9RQa/Y+X6ktFFFBS2XovyLFFFFAySPv+H9amT7w/H+RqGPv+H9amT7w/H+Rprdeq/M1XwfJ/qTUUUVuKn1+X6k69B9B/KlpF6D6D+VLUQ2f+JmgVMn3R+P8AM1DUyfdH4/zNWBNH3/D+tSVHH3/D+tSVov4fyf5gTJ90fj/M06mp90fj/M06rWy9F+QBUqdD9f6CoqlTofr/AEFM3Wy9F+SH0q9R9R/OkpV6j6j+dAyerFV6sU4/EvX/ADAVeo+o/nU9QL1H1H86nrSO8v8AEAVKnQ/X+gqKpU6H6/0FWaw2fr+iH05PvD8f5Gm05PvD8f5GqjtL/CWTVYqvViq/59/MBV6j6j+dT1AvUfUfzqetAHp1P0/qKlqJOp+n9RUtABU69B9B/KoKnXoPoP5UALT06n6f1FMp6dT9P6itKfX5fqVH4ZeiJalTofr/AEFRVKnQ/X+grQ1Wy9F+RMnU/T+oqWok6n6f1FS0DCp16D6D+VQVOvQfQfyoAWpI+/4f1qOpI+/4f1ql8EvVASVKnQ/X+gqKpU6H6/0FarZei/JGsvhXyJk6n6f1FS1EnU/T+oqWmTL4l8iSPv8Ah/WpKjj7/h/WpKcfiXr/AJmoVJH3/D+tR1JH3/D+taR3l/iAkoooqwLFOT7w/H+RptOT7w/H+RoGt16r8yarFV6sU4/EvX/M0j8UvVCr1H1H86nqBeo+o/nU9blhSr1H1H86SlXqPqP50AT05PvD8f5Gm05PvD8f5GqjtL/CBbTofr/QU1Op+n9RTk6H6/0FNTqfp/UUR+GXogJakj7/AIf1qOpI+/4f1rVbL0X5ASUq9R9R/OkpV6j6j+dMqG7/AMLJ6KKKunu/T9R0936fqSp0P1/oKfTE6H6/0FPrUqPxS9UOT7w/H+RqaoU+8Px/kamoLLFTJ90fj/M1DUyfdH4/zNa/bf8AhQDqnXoPoP5VBU69B9B/Kpfx/NfoAtFFFagfzlJ1P0/qKlqJOp+n9RUtfzufzet16r80SR9/w/rUlRx9/wAP61JQW/j+a/QKKKKDUmT7o/H+ZqdOh+v9BUCfdH4/zNTp0P1/oK0XxR/wGi+KP+AfSr1H1H86SlXqPqP51oaLdeq/NE9OT7w/H+RptOT7w/H+RoOgmooooAKlTofr/QVFUqdD9f6Cq+w/8SAfSr1H1H86SlXqPqP51sC3XqvzRPT06n6f1FMp6dT9P6ig6CWiiigByfeH4/yNTVCn3h+P8jU1V9h/4kV9h/4kPTqfp/UVLUSdT9P6ipaH8K9WXD4fmwqxVerFEvhj6MsKKKK1Wy9F+RpT2fr+g5PvD8f5GpqhT7w/H+Rqarh8XyZoSR9/w/rUlRx9/wAP61JVr45eiAKsVXqxU/b+f6Gv2Pl+oVJH3/D+tR1JH3/D+tVHeX+IXWH+H9CSlXqPqP50lKvUfUfzqzQnoooprdeq/MAqxVerFaS+KPqwCiiirKh8XyZYpV6j6j+dJSr1H1H86iHw/Nl/bf8AhRPRRRVlkyfdH4/zNOpqfdH4/wAzTqAJ16D6D+VLSL0H0H8qWgqHxfJhUyfdH4/zNQ1Mn3R+P8zWs9l/iRsOqxVerFKp0+f6AKvUfUfzqeoF6j6j+dT1Mto/4QCpU6H6/wBBUVSp0P1/oKuXwr5APooooh8PzYBViq9WKs0/59/MKKKKDQsx9V+n9KnqCPqv0/pU9ABU69B9B/KoKnXoPoP5UALT06n6f1FMp6dT9P6ig1+x8v1JaKKKClsvRfkWKKKKBkkff8P61Mn3h+P8jUMff8P61Mn3h+P8jTW69V+Zqvg+T/UmooorcVPr8v1J16D6D+VLSL0H0H8qWohs/wDEzQKmT7o/H+ZqGpk+6Px/masCaPv+H9akqOPv+H9akrRfw/k/zAmT7o/H+Zp1NT7o/H+Zp1Wtl6L8gCpU6H6/0FRVKnQ/X+gpm62XovyQ+lXqPqP50lKvUfUfzoGT1YqvVinH4l6/5gKvUfUfzqeoF6j6j+dT1pHeX+IAqVOh+v8AQVFUqdD9f6CrNYbP1/RD6cn3h+P8jTacn3h+P8jVR2l/hLJqsVXqxVf8+/mAq9R9R/Op6gXqPqP51PWgD06n6f1FS1EnU/T+oqWgAqdeg+g/lUFTr0H0H8qAFp6dT9P6imU9Op+n9RWlPr8v1Kj8MvREtSp0P1/oKiqVOh+v9BWhqtl6L8iZOp+n9RUtRJ1P0/qKloGFTr0H0H8qgqdeg+g/lQAtSR9/w/rUdSR9/wAP61S+CXqgJKlTofr/AEFRVKnQ/X+grVbL0X5I1l8K+RMnU/T+oqWok6n6f1FS0yZfEvkSR9/w/rUlRx9/w/rUlOPxL1/zNQqSPv8Ah/Wo6kj7/h/WtI7y/wAQElFFFWBYpyfeH4/yNNpyfeH4/wAjQNbr1X5k1WKr1Ypx+Jev+ZpH4peqFXqPqP51PUC9R9R/Op63LClXqPqP50lKvUfUfzoAnpyfeH4/yNNpyfeH4/yNVHaX+EC2nQ/X+gpqdT9P6inJ0P1/oKanU/T+ooj8MvRAS1JH3/D+tR1JH3/D+tarZei/ICSlXqPqP50lKvUfUfzplQ3f+Fk9FFFXT3fp+o6e79P1JU6H6/0FPpidD9f6Cn1qVH4peqHJ94fj/I1NUKfeH4/yNTUFlipk+6Px/mahqZPuj8f5mtftv/CgHVOvQfQfyqCp16D6D+VS/j+a/QBaKKK1A/nKTqfp/UVLUSdT9P6ipa/nc/m9br1X5okj7/h/WpKjj7/h/WpKC38fzX6BRRRQakyfdH4/zNTp0P1/oKgT7o/H+ZqdOh+v9BWi+KP+A0XxR/wD6Veo+o/nSUq9R9R/OtDRbr1X5onpyfeH4/yNNpyfeH4/yNB0E1FFFABUqdD9f6CoqlTofr/QVX2H/iQD6Veo+o/nSUq9R9R/OtgW69V+aJ6enU/T+oplPTqfp/UUHQS0UUUAOT7w/H+RqaoU+8Px/kamqvsP/EivsP8AxIenU/T+oqWok6n6f1FS0P4V6suHw/NhViq9WKJfDH0ZYUUUVqtl6L8jSns/X9ByfeH4/wAjU1Qp94fj/I1NVw+L5M0JI+/4f1qSo4+/4f1qSrXxy9EAVYqvVip+38/0NfsfL9QqSPv+H9ajqSPv+H9aqO8v8QusP8P6ElKvUfUfzpKVeo+o/nVmhPRRRTW69V+YBViq9WK0l8UfVgFFFFWVD4vkyxSr1H1H86SlXqPqP51EPh+bL+2/8KJ6KKKssmT7o/H+Zp1NT7o/H+Zp1AE69B9B/KlpF6D6D+VLQVD4vkwqZPuj8f5moamT7o/H+ZrWey/xI2HVYqvVilU6fP8AQBV6j6j+dT1AvUfUfzqepltH/CAVKnQ/X+gqKpU6H6/0FXL4V8gH0UUUQ+H5sAqxVerFWaf8+/mFFFFBoWY+q/T+lT1BH1X6f0qegAqdeg+g/lUFTr0H0H8qAFp6dT9P6imU9Op+n9RQa/Y+X6ktFFFBS2XovyLFFFFAySPv+H9amT7w/H+RqGPv+H9amT7w/H+Rprdeq/M1XwfJ/qTUUUVuKn1+X6k69B9B/KlpF6D6D+VLUQ2f+JmgVMn3R+P8zUNTJ90fj/M1YE0ff8P61JUcff8AD+tSVov4fyf5gTJ90fj/ADNOpqfdH4/zNOq1svRfkAVKnQ/X+gqKpU6H6/0FM3Wy9F+SH0q9R9R/OkpV6j6j+dAyerFV6sU4/EvX/MBV6j6j+dT1AvUfUfzqetI7y/xAFSp0P1/oKiqVOh+v9BVmsNn6/oh9OT7w/H+RptOT7w/H+Rqo7S/wlk1WKr1Yqv8An38wFXqPqP51PUC9R9R/Op60AenU/T+oqWok6n6f1FS0AFTr0H0H8qgqdeg+g/lQAtPTqfp/UUynp1P0/qK0p9fl+pUfhl6IlqVOh+v9BUVSp0P1/oK0NVsvRfkTJ1P0/qKlqJOp+n9RUtAwqdeg+g/lUFTr0H0H8qAFqSPv+H9ajqSPv+H9apfBL1QElSp0P1/oKiqVOh+v9BWq2XovyRrL4V8iZOp+n9RUtRJ1P0/qKlpky+JfIkj7/h/WpKjj7/h/WpKcfiXr/mahUkff8P61HUkff8P61pHeX+ICSiiirAsU5PvD8f5Gm05PvD8f5Gga3XqvzJqsVXqxTj8S9f8AM0j8UvVCr1H1H86nqBeo+o/nU9blhSr1H1H86SlXqPqP50AT05PvD8f5Gm05PvD8f5GqjtL/AAgW06H6/wBBTU6n6f1FOTofr/QU1Op+n9RRH4ZeiAlqSPv+H9ajqSPv+H9a1Wy9F+QElKvUfUfzpKVeo+o/nTKhu/8ACyeiiirp7v0/UdPd+n6kqdD9f6Cn0xOh+v8AQU+tSo/FL1Q5PvD8f5GpqhT7w/H+RqagssVMn3R+P8zUNTJ90fj/ADNa/bf+FAOqdeg+g/lUFTr0H0H8ql/H81+gC0UUVqB/OUnU/T+oqWok6n6f1FS1/O5/N63XqvzRJH3/AA/rUlRx9/w/rUlBb+P5r9AooooNSZPuj8f5mp06H6/0FQJ90fj/ADNTp0P1/oK0XxR/wGi+KP8AgH0q9R9R/OkpV6j6j+daGi3XqvzRPTk+8Px/kabTk+8Px/kaDoJqKKKACpU6H6/0FRVKnQ/X+gqvsP8AxIB9KvUfUfzpKVeo+o/nWwLdeq/NE9PTqfp/UUynp1P0/qKDoJaKKKAHJ94fj/I1NUKfeH4/yNTVX2H/AIkV9h/4kPTqfp/UVLUSdT9P6ipaH8K9WXD4fmwqxVerFEvhj6MsKKKK1Wy9F+RpT2fr+g5PvD8f5GpqhT7w/H+Rqarh8XyZoSR9/wAP61JUcff8P61JVr45eiAKsVXqxU/b+f6Gv2Pl+oVJH3/D+tR1JH3/AA/rVR3l/iF1h/h/QkpV6j6j+dJSr1H1H86s0J6KKKa3XqvzAKsVXqxWkvij6sAoooqyofF8mWKVeo+o/nSUq9R9R/Ooh8PzZf23/hRPRRRVlkyfdH4/zNOpqfdH4/zNOoAnXoPoP5UtIvQfQfypaCofF8mFTJ90fj/M1DUyfdH4/wAzWs9l/iRsOqxVerFKp0+f6AKvUfUfzqeoF6j6j+dT1Mto/wCEAqVOh+v9BUVSp0P1/oKuXwr5APooooh8PzYBViq9WKs0/wCffzCiiig0LMfVfp/Sp6gj6r9P6VPQAVOvQfQfyqCp16D6D+VAC09Op+n9RTKenU/T+ooNfsfL9SWiiigpbL0X5FiiiigZJH3/AA/rUyfeH4/yNQx9/wAP61Mn3h+P8jTW69V+Zqvg+T/UmooorcVPr8v1J16D6D+VLSL0H0H8qWohs/8AEzQKmT7o/H+ZqGpk+6Px/masCaPv+H9akqOPv+H9akrRfw/k/wAwJk+6Px/madTU+6Px/madVrZei/IAqVOh+v8AQVFUqdD9f6CmbrZei/JD6Veo+o/nSUq9R9R/OgZPViq9WKcfiXr/AJgKvUfUfzqeoF6j6j+dT1pHeX+IAqVOh+v9BUVSp0P1/oKs1hs/X9EPpyfeH4/yNNpyfeH4/wAjVR2l/hLJqsVXqxVf8+/mAq9R9R/Op6gXqPqP51PWgD06n6f1FS1EnU/T+oqWgAqdeg+g/lUFTr0H0H8qAFp6dT9P6imU9Op+n9RWlPr8v1Kj8MvREtSp0P1/oKiqVOh+v9BWhqtl6L8iZOp+n9RUtRJ1P0/qKloGFTr0H0H8qgqdeg+g/lQAtSR9/wAP61HUkff8P61S+CXqgJKlTofr/QVFUqdD9f6CtVsvRfkjWXwr5EydT9P6ipaiTqfp/UVLTJl8S+RJH3/D+tSVHH3/AA/rUlOPxL1/zNQqSPv+H9ajqSPv+H9a0jvL/EBJRRRVgWKcn3h+P8jTacn3h+P8jQNbr1X5k1WKr1Ypx+Jev+ZpH4peqFXqPqP51PUC9R9R/Op63LClXqPqP50lKvUfUfzoAnpyfeH4/wAjTacn3h+P8jVR2l/hAtp0P1/oKanU/T+opydD9f6Cmp1P0/qKI/DL0QEtSR9/w/rUdSR9/wAP61qtl6L8gJKVeo+o/nSUq9R9R/OmVDd/4WT0UUVdPd+n6jp7v0/UlTofr/QU+mJ0P1/oKfWpUfil6ocn3h+P8jU1Qp94fj/I1NQWWKmT7o/H+ZqGpk+6Px/ma1+2/wDCgHVOvQfQfyqCp16D6D+VS/j+a/QBaKKK1A/nKTqfp/UVLUSdT9P6ipa/nc/m9br1X5okj7/h/WpKjj7/AIf1qSgt/H81+gUUUUGpMn3R+P8AM1OnQ/X+gqBPuj8f5mp06H6/0FaL4o/4DRfFH/APpV6j6j+dJSr1H1H860NFuvVfmienJ94fj/I02nJ94fj/ACNB0E1FFFABUqdD9f6CoqlTofr/AEFV9h/4kA+lXqPqP50lKvUfUfzrYFuvVfmienp1P0/qKZT06n6f1FB0EtFFFADk+8Px/kamqFPvD8f5Gpqr7D/xIr7D/wASHp1P0/qKlqJOp+n9RUtD+FerLh8PzYVYqvViiXwx9GWFFFFarZei/I0p7P1/Qcn3h+P8jU1Qp94fj/I1NVw+L5M0JI+/4f1qSo4+/wCH9akq18cvRAFWKr1Yqft/P9DX7Hy/UKkj7/h/Wo6kj7/h/WqjvL/ELrD/AA/oSUq9R9R/OkpV6j6j+dWaE9FFFNbr1X5gFWKr1YrSXxR9WAUUUVZUPi+TLFKvUfUfzpKVeo+o/nUQ+H5sv7b/AMKJ6KKKssmT7o/H+Zp1NT7o/H+Zp1AE69B9B/KlpF6D6D+VLQVD4vkwqZPuj8f5moamT7o/H+ZrWey/xI2HVYqvVilU6fP9AFXqPqP51PUC9R9R/Op6mW0f8IBUqdD9f6CoqlTofr/QVcvhXyAfRRRRD4fmwCrFV6sVZp/z7+YUUUUGhZj6r9P6VPUEfVfp/Sp6ACp16D6D+VQVOvQfQfyoAWnp1P0/qKZT06n6f1FBr9j5fqS0UUUFLZei/IsUUUUDJI+/4f1qZPvD8f5GoY+/4f1qZPvD8f5Gmt16r8zVfB8n+pNRRRW4qfX5fqTr0H0H8qWkXoPoP5UtRDZ/4maBUyfdH4/zNQ1Mn3R+P8zVgTR9/wAP61JUcff8P61JWi/h/J/mBMn3R+P8zTqan3R+P8zTqtbL0X5AFSp0P1/oKiqVOh+v9BTN1svRfkh9KvUfUfzpKVeo+o/nQMnqxVerFOPxL1/zAVeo+o/nU9QL1H1H86nrSO8v8QBUqdD9f6CoqlTofr/QVZrDZ+v6IfTk+8Px/kabTk+8Px/kaqO0v8JZNViq9WKr/n38wFXqPqP51PUC9R9R/Op60AenU/T+oqWok6n6f1FS0AFTr0H0H8qgqdeg+g/lQAtPTqfp/UUynp1P0/qK0p9fl+pUfhl6IlqVOh+v9BUVSp0P1/oK0NVsvRfkTJ1P0/qKlqJOp+n9RUtAwqdeg+g/lUFTr0H0H8qAFqSPv+H9ajqSPv8Ah/WqXwS9UBJUqdD9f6CoqlTofr/QVqtl6L8kay+FfImTqfp/UVLUSdT9P6ipaZMviXyJI+/4f1qSo4+/4f1qSnH4l6/5moVJH3/D+tR1JH3/AA/rWkd5f4gJKKKKsCxTk+8Px/kabTk+8Px/kaBrdeq/MmqxVerFOPxL1/zNI/FL1Qq9R9R/Op6gXqPqP51PW5YUq9R9R/OkpV6j6j+dAE9OT7w/H+RptOT7w/H+Rqo7S/wgW06H6/0FNTqfp/UU5Oh+v9BTU6n6f1FEfhl6ICWpI+/4f1qOpI+/4f1rVbL0X5ASUq9R9R/OkpV6j6j+dMqG7/wsnoooq6e79P1HT3fp+pKnQ/X+gp9MTofr/QU+tSo/FL1Q5PvD8f5GpqhT7w/H+RqagssVMn3R+P8AM1DUyfdH4/zNa/bf+FAOqdeg+g/lUFTr0H0H8ql/H81+gC0UUVqB/9k="/>

						</td>		
					
						<td align="right">
									<div id="qrcode"/>
									<div id="qrvalue" style="visibility: hidden; height: 30px;width: 30px; ; display:none"> 
		{"vkntckn":"<xsl:value-of  select="n1:DespatchAdvice/cac:DespatchSupplierParty/cac:Party/cac:PartyIdentification/cbc:ID[@schemeID='TCKN' or @schemeID='VKN']"></xsl:value-of>",
		"avkntckn":"<xsl:value-of  select="n1:DespatchAdvice/cac:DeliveryCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID[@schemeID='TCKN' or @schemeID='VKN']"></xsl:value-of>",
		"senaryo":"<xsl:value-of select="n1:DespatchAdvice/cbc:ProfileID"/>",
	"tip":"<xsl:value-of select="n1:DespatchAdvice/cbc:DespatchAdviceTypeCode"/>",
	"tarih":"<xsl:value-of select="n1:DespatchAdvice/cbc:IssueDate"/>",
		"no":"<xsl:value-of select="n1:DespatchAdvice/cbc:ID"/>",
		"ETTN":"<xsl:value-of select="n1:DespatchAdvice/cbc:UUID"/>",
		"sevktarihi":"<xsl:value-of select="n1:DespatchAdvice/cac:Shipment/cac:Delivery/cac:Despatch/cbc:ActualDespatchDate"/>",
		"sevkzamani":"<xsl:value-of select="n1:DespatchAdvice/cac:Shipment/cac:Delivery/cac:Despatch/cbc:ActualDespatchTime"/>",
		"tasiyicivkn":"<xsl:value-of  select="n1:DespatchAdvice/cac:Shipment/cac:Delivery/cac:CarrierParty/cac:PartyIdentification/cbc:ID[@schemeID='TCKN' or @schemeID='VKN']"></xsl:value-of>",
		"plaka":"<xsl:value-of  select="n1:DespatchAdvice/cac:Shipment/cac:ShipmentStage/cac:TransportMeans/cac:RoadTransport/cbc:LicensePlateID"/>",
		
		</div>
									<script type="text/javascript">

										var qrcode = new QRCode(document.getElementById("qrcode"), {
											width : 120,
											height : 120,
											
											correctLevel : QRCode.CorrectLevel.L
										});

										function makeCode (msg) {		
											var elText = document.getElementById("text");
	
											qrcode.makeCode(msg);
										}

										makeCode(document.getElementById("qrvalue").innerHTML);
									</script>
								</td>					
					</tr>
							<tr valign="top">
								<td width="40%">
									<br/>
									<hr/>
									<table align="center" border="0" width="100%">
										<tbody>
											<tr align="left">
												<xsl:for-each select="n1:DespatchAdvice/cac:DespatchSupplierParty/cac:Party">
													<td align="left">
													<xsl:if test="cac:PartyName">
													<xsl:value-of select="cac:PartyName/cbc:Name"/>
													<br/>
													</xsl:if>
													
													</td>
												</xsl:for-each>
											</tr>
											<tr align="left">
												<xsl:for-each select="n1:DespatchAdvice/cac:DespatchSupplierParty/cac:Party">
												<td align="left">
												<xsl:for-each select="cac:PostalAddress">
													<xsl:for-each select="cbc:StreetName">
													<xsl:apply-templates/>
													<xsl:text>&#160;</xsl:text>
													</xsl:for-each>
													<xsl:for-each select="cbc:BuildingName">
													<xsl:apply-templates/>
													</xsl:for-each>
													<xsl:if test="cbc:BuildingNumber">
													<xsl:text> No:</xsl:text>
													<xsl:for-each select="cbc:BuildingNumber">
													<xsl:apply-templates/>
													</xsl:for-each>
													<xsl:text>&#160;</xsl:text>
													</xsl:if>
													<br/>
													<xsl:for-each select="cbc:PostalZone">
													<xsl:apply-templates/>
													<xsl:text>&#160;</xsl:text>
													</xsl:for-each>
													<xsl:for-each select="cbc:CitySubdivisionName">
													<xsl:apply-templates/>
													</xsl:for-each>
													<xsl:text>/ </xsl:text>
													<xsl:for-each select="cbc:CityName">
													<xsl:apply-templates/>
													<xsl:text>&#160;</xsl:text>
													</xsl:for-each>
												</xsl:for-each>
												</td>
												</xsl:for-each>
											</tr>
											<xsl:if
												test="//n1:DespatchAdvice/cac:DespatchSupplierParty/cac:Party/cac:Contact/cbc:Telephone or //n1:DespatchAdvice/cac:DespatchSupplierParty/cac:Party/cac:Contact/cbc:Telefax">
												<tr align="left">
													<xsl:for-each select="n1:DespatchAdvice/cac:DespatchSupplierParty/cac:Party">														
														<td align="left">
														<xsl:for-each select="cac:Contact">
														<xsl:if test="cbc:Telephone">
														<xsl:text>Tel: </xsl:text>
														<xsl:for-each select="cbc:Telephone">
														<xsl:apply-templates/>
														</xsl:for-each>
														</xsl:if>
														<xsl:if test="cbc:Telefax">
														<xsl:text> Fax: </xsl:text>
														<xsl:for-each select="cbc:Telefax">
														<xsl:apply-templates/>
														</xsl:for-each>
														</xsl:if>
														<xsl:text>&#160;</xsl:text>
														</xsl:for-each>
														</td>
													</xsl:for-each>
												</tr>
											</xsl:if>
											<xsl:for-each
												select="//n1:DespatchAdvice/cac:DespatchSupplierParty/cac:Party/cbc:WebsiteURI">
												<tr align="left">
												<td>
												<xsl:text>Web Sitesi: </xsl:text>
												<xsl:value-of select="."/>
												</td>
												</tr>
											</xsl:for-each>
											<xsl:for-each
												select="//n1:DespatchAdvice/cac:DespatchSupplierParty/cac:Party/cac:Contact/cbc:ElectronicMail">
												<tr align="left">
												<td>
												<xsl:text>E-Posta: </xsl:text>
												<xsl:value-of select="."/>
												</td>
												</tr>
											</xsl:for-each>
											<tr align="left">
												<xsl:for-each select="n1:DespatchAdvice/cac:DespatchSupplierParty/cac:Party">																											
													<td align="left">
													<xsl:text>Vergi Dairesi: </xsl:text>
													<xsl:for-each select="cac:PartyTaxScheme">
													<xsl:for-each select="cac:TaxScheme">
													<xsl:for-each select="cbc:Name">
													<xsl:apply-templates/>
													</xsl:for-each>
													</xsl:for-each>
													<xsl:text>&#160; </xsl:text>
													</xsl:for-each>
													</td>
												</xsl:for-each>
											</tr>
											<xsl:for-each
												select="//n1:DespatchAdvice/cac:DespatchSupplierParty/cac:Party/cac:PartyIdentification">
												<tr align="left">
												<td>
												<xsl:value-of select="cbc:ID/@schemeID"/>
												<xsl:text>: </xsl:text>
												<xsl:value-of select="cbc:ID"/>
												</td>
												</tr>
											</xsl:for-each>
										</tbody>
									</table>
									<hr/>
								</td>
								<td width="20%" align="center" valign="middle">
									<br/>
									<br/>
									<img style="width:91px;" align="middle" alt="E-Fatura Logo"
										src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4QBoRXhpZgAASUkqAAgAAAADABIBAwABAAAAAQAAADEBAgAQAAAAMgAAAGmHBAABAAAAQgAAAAAAAABTaG90d2VsbCAwLjIyLjAAAgACoAkAAQAAAKYBAAADoAkAAQAAAKYBAAAAAAAA/+EJ9Gh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8APD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNC40LjAtRXhpdjIiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyIgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iIGV4aWY6UGl4ZWxYRGltZW5zaW9uPSI0MjIiIGV4aWY6UGl4ZWxZRGltZW5zaW9uPSI0MjIiIHRpZmY6SW1hZ2VXaWR0aD0iNDIyIiB0aWZmOkltYWdlSGVpZ2h0PSI0MjIiIHRpZmY6T3JpZW50YXRpb249IjEiLz4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8P3hwYWNrZXQgZW5kPSJ3Ij8+/9sAQwADAgIDAgIDAwMDBAMDBAUIBQUE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"/>

									<h1 align="center">
										<span style="font-weight:bold; ">
											<xsl:text>e-İRSALİYE</xsl:text>
										</span>
									</h1>
								</td>
					
							</tr>
							<tr style="height:118px; " valign="top">
								<td width="40%" align="right" valign="bottom">
									<table id="customerPartyTable" align="left" border="0">
										<tbody>
											<tr style="height:71px; ">
												<td>
												<hr/>
												<table align="center" border="0">
												<tbody>
												<tr>
												<xsl:for-each select="n1:DespatchAdvice/cac:DeliveryCustomerParty/cac:Party">
													<td style="width:469px; " align="left">
														<span style="font-weight:bold; ">
															<xsl:text>SAYIN</xsl:text>
														</span>
													</td>
												</xsl:for-each>													
												</tr>
												<tr>
													<xsl:choose>
														<xsl:when test="n1:DespatchAdvice/cac:BuyerCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID[@schemeID='PARTYTYPE' and text()='TAXFREE']">
															<xsl:for-each select="n1:DespatchAdvice/cac:BuyerCustomerParty/cac:Party">
																<xsl:call-template name="Party_Title">
																	<xsl:with-param name="PartyType">TAXFREE</xsl:with-param>
																</xsl:call-template>
															</xsl:for-each>															
														</xsl:when>
														<xsl:otherwise>
															<xsl:for-each select="n1:DespatchAdvice/cac:DeliveryCustomerParty/cac:Party">
																<xsl:call-template name="Party_Title">
																	<xsl:with-param name="PartyType">OTHER</xsl:with-param>
																</xsl:call-template>
															</xsl:for-each>															
														</xsl:otherwise>
													</xsl:choose>													
												</tr>
													<xsl:choose>
														<xsl:when test="n1:DespatchAdvice/cac:BuyerCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID[@schemeID='PARTYTYPE' and text()='TAXFREE']">
																<xsl:for-each select="n1:DespatchAdvice/cac:BuyerCustomerParty/cac:Party">
																	<tr>
																		<xsl:call-template name="Party_Adress">
																			<xsl:with-param name="PartyType">TAXFREE</xsl:with-param>
																		</xsl:call-template>
																	</tr>
																	<xsl:call-template name="Party_Other">
																		<xsl:with-param name="PartyType">TAXFREE</xsl:with-param>
																	</xsl:call-template>
																</xsl:for-each>															
														</xsl:when>
														<xsl:otherwise>
															<xsl:for-each select="n1:DespatchAdvice/cac:DeliveryCustomerParty/cac:Party">
																<tr>
																	<xsl:call-template name="Party_Adress">
																		<xsl:with-param name="PartyType">OTHER</xsl:with-param>																	
																	</xsl:call-template>
																</tr>
																<xsl:call-template name="Party_Other">
																	<xsl:with-param name="PartyType">OTHER</xsl:with-param>
																</xsl:call-template>
															</xsl:for-each>
														</xsl:otherwise>
													</xsl:choose>																										
												</tbody>
												</table>
												<hr/>
												</td>
											</tr>
										</tbody>
									</table>
									<br/>
								</td>
								<td align="right" valign="middle">
								<img style="width: 250px;" align="middle" src=""/>
								</td>
	
								<td width="60%" align="center" valign="bottom" colspan="2">
									<table border="1" id="despatchTable">
										<tbody>
											<tr>
												<td style="width:105px;" align="left">
												<span style="font-weight:bold; ">
												<xsl:text>Özelleştirme No:</xsl:text>
												</span>
												</td>
												<td style="width:110px;" align="left">
													<xsl:for-each select="n1:DespatchAdvice/cbc:CustomizationID">
														<xsl:apply-templates/>
													</xsl:for-each>
												</td>
											</tr>
											<tr style="height:13px; ">
												<td align="left">
												<span style="font-weight:bold; ">
												<xsl:text>Senaryo:</xsl:text>
												</span>
												</td>
												<td align="left">
													<xsl:for-each select="n1:DespatchAdvice/cbc:ProfileID">
														<xsl:apply-templates/>
													</xsl:for-each>
												</td>
											</tr>
											<tr style="height:13px; ">
												<td align="left">
												<span style="font-weight:bold; ">
												<xsl:text>İrsaliye Tipi:</xsl:text>
												</span>
												</td>
												<td align="left">
													<xsl:for-each select="n1:DespatchAdvice/cbc:DespatchAdviceTypeCode">
														<xsl:apply-templates/>
													</xsl:for-each>
												</td>
											</tr>
											<tr style="height:13px; ">
												<td align="left">
												<span style="font-weight:bold; ">
												<xsl:text>İrsaliye No:</xsl:text>
												</span>
												</td>
												<td align="left">
													<xsl:for-each select="n1:DespatchAdvice/cbc:ID">
														<xsl:apply-templates/>
													</xsl:for-each>
												</td>
											</tr>
											<tr style="height:13px; ">
												<td align="left">
												<span style="font-weight:bold; ">
												<xsl:text>İrsaliye Tarihi:</xsl:text>
												</span>
												</td>
												<td align="left">
													<xsl:for-each select="n1:DespatchAdvice/cbc:IssueDate">
														<xsl:apply-templates select="."/>
													</xsl:for-each>
												</td>
											</tr>
											<tr style="height:13px; ">
												<td align="left">
												<span style="font-weight:bold; ">
												<xsl:text>İrsaliye Zamanı:</xsl:text>
												</span>
												</td>
												<td align="left">
													<xsl:for-each select="n1:DespatchAdvice/cbc:IssueTime">
														<xsl:apply-templates select="."/>
													</xsl:for-each>
												</td>
											</tr>
											<tr style="height:13px; ">
												<td align="left">
												<span style="font-weight:bold; ">
												<xsl:text>Sevk Tarihi:</xsl:text>
												</span>
												</td>
												<td align="left">
													<xsl:for-each select="n1:DespatchAdvice/cac:Shipment/cac:Delivery/cac:Despatch/cbc:ActualDespatchDate">
														<xsl:apply-templates select="."/>
													</xsl:for-each>
												</td>
											</tr>
											<tr style="height:13px; ">
												<td align="left">
												<span style="font-weight:bold; ">
												<xsl:text>Sevk Zamanı:</xsl:text>
												</span>
												</td>
												<td align="left">
													<xsl:for-each select="n1:DespatchAdvice/cac:Shipment/cac:Delivery/cac:Despatch/cbc:ActualDespatchTime">
														<xsl:apply-templates select="."/>
													</xsl:for-each>
												</td>
											</tr>
											
											<xsl:if test="n1:DespatchAdvice/cac:OrderReference">
												<tr style="height:13px">
													<td align="left">
														<span style="font-weight:bold; ">
															<xsl:text>Sipariş No:</xsl:text>
														</span>
													</td>
													<td align="left">
														<xsl:for-each select="n1:DespatchAdvice/cac:OrderReference/cbc:ID">
															<xsl:apply-templates/>
														</xsl:for-each>
													</td>
												</tr>
											</xsl:if>
											<xsl:if	test="n1:DespatchAdvice/cac:OrderReference/cbc:IssueDate">
												<tr style="height:13px">
													<td align="left">
														<span style="font-weight:bold; ">
														<xsl:text>Sipariş Tarihi:</xsl:text>
														</span>
													</td>
													<td align="left">
														<xsl:for-each select="n1:DespatchAdvice/cac:OrderReference/cbc:IssueDate">
															<xsl:apply-templates select="."/>
														</xsl:for-each>
													</td>
												</tr>
											</xsl:if>
										</tbody>
									</table>
								</td>
							</tr>
							<tr align="left">
								<td align="left" valign="top" id="ettnTable">
									<span style="font-weight:bold; ">
										<xsl:text>ETTN:&#160;</xsl:text>
									</span>
									<xsl:for-each select="n1:DespatchAdvice/cbc:UUID">
										<xsl:apply-templates/>
									</xsl:for-each>
								</td>
							</tr>
						</tbody>
					</table>
					<div id="lineTableAligner">
						<span>
							<xsl:text>&#160;</xsl:text>
						</span>
					</div>
					<table border="1" id="lineTable" width="800">
						<tbody>
							<tr class="lineTableTr">
								<td class="lineTableTd" style="width:5%" align="center">
									<span style="font-weight:bold;">
										<xsl:text>Sıra No</xsl:text>
									</span>
								</td>
								<td class="lineTableTd" style="width:35%" align="center">
									<span style="font-weight:bold;">
										<xsl:text>Mal</xsl:text>
									</span>
								</td>
								<td class="lineTableTd" style="width:10%" align="center">
									<span style="font-weight:bold;">
										<xsl:text>Miktar</xsl:text>
									</span>
								</td>
								<td class="lineTableTd" style="width:10%" align="center">
									<span style="font-weight:bold;">
										<xsl:text>Birim Fiyat</xsl:text>
									</span>
								</td>
								<td class="lineTableTd" style="width:20%" align="center">
									<span style="font-weight:bold;">
										<xsl:text>Sonra Gönderilecek Miktar</xsl:text>
									</span>
								</td>
								
								<td class="lineTableTd" style="width:20%" align="center">
									<span style="font-weight:bold;">
										<xsl:text>Tutar</xsl:text>
									</span>
								</td>
							</tr>
							<xsl:if test="count(//n1:DespatchAdvice/cac:DespatchLine) &gt;= 0">
								<xsl:for-each select="//n1:DespatchAdvice/cac:DespatchLine">
									<xsl:apply-templates select="."/>
								</xsl:for-each>
							</xsl:if>
							
						</tbody>
					</table>
				</xsl:for-each>
				<table id="budgetContainerTable" width="800px">
					<tr align="right">
						<td/>
						<td class="lineTableBudgetTd" align="right" width="156px">
							<span style="font-weight:bold; ">
								<xsl:text>Toplam Tutar</xsl:text>
							</span>
						</td>
						<td class="lineTableBudgetTd" style="width:156px; " align="right">
							<xsl:for-each select="n1:DespatchAdvice/cac:Shipment/cac:GoodsItem/cbc:ValueAmount">
								<xsl:call-template name="Curr_Type"/>
							</xsl:for-each>
						</td>
					</tr>
				</table>
				<br/>
				<xsl:if test="//n1:DespatchAdvice/cac:AdditionalDocumentReference">
					<table id="lineTable" width="800">
						<thead>
							<tr>
								<td align="left"><span style="font-weight:bold; " align="center">&#160;&#160;&#160;&#160;&#160;İlgili Dokümanlar</span></td>							
								<td align="left"><span style="font-weight:bold; " align="center">&#160;&#160;&#160;&#160;&#160;</span></td>
								<td align="left"><span style="font-weight:bold; " align="center">&#160;&#160;&#160;&#160;&#160;</span></td>
								<td align="left"><span style="font-weight:bold; " align="center">&#160;&#160;&#160;&#160;&#160;</span></td>
							</tr>
						</thead>					
						<tbody>
							<tr align="left" class="lineTableTr">							
								<td class="lineTableTd">
									<span style="font-weight:bold; " align="center">&#160;&#160;&#160;&#160;&#160;Doküman No</span>
								</td>
								<td class="lineTableTd"><span style="font-weight:bold; " align="center">&#160;&#160;&#160;&#160;&#160;Tarih</span></td>
								<td class="lineTableTd"><span style="font-weight:bold; " align="center">&#160;&#160;&#160;&#160;&#160;Doküman Tipi</span></td>
								<td class="lineTableTd"><span style="font-weight:bold; " align="center">&#160;&#160;&#160;&#160;&#160;Açıklama</span></td>
							</tr>
							<xsl:for-each select="//n1:DespatchAdvice/cac:AdditionalDocumentReference">
								<tr align="left" class="lineTableTr">
									<td class="lineTableTd">&#160;&#160;&#160;&#160;&#160;
										<xsl:value-of select="./cbc:ID"/> 
									</td>
									<td class="lineTableTd">&#160;&#160;&#160;&#160;&#160;
										<xsl:for-each select="./cbc:IssueDate">
											<xsl:apply-templates select="."/>
										</xsl:for-each> 
									</td>
									<td class="lineTableTd">&#160;&#160;&#160;&#160;&#160;
										<xsl:value-of select="./cbc:DocumentType"/> 
									</td>
									<td class="lineTableTd">&#160;&#160;&#160;&#160;&#160;
										<xsl:value-of select="./cbc:DocumentDescription"/> 
									</td>
								</tr>
							</xsl:for-each>
						</tbody>
					</table>
				</xsl:if>
				<br/>
				<table id="notesTable" width="800" align="left">
				<thead>
							<tr>
								<td align="left"><span style="font-weight:bold; " align="center">&#160;&#160;&#160;&#160;&#160;Açıklamalar</span></td>
								<td align="left"><span style="font-weight:bold; " align="center">&#160;&#160;&#160;&#160;&#160;Taşıyıcı Bilgileri</span></td>								
							</tr>
						</thead>
					<tbody>
						<tr align="left">
							<td id="notesTableTd" height="100">
								<xsl:for-each select="//n1:DespatchAdvice/cbc:Note">
									<b>&#160;&#160;&#160;&#160;&#160;&#160;Not: </b>
									<xsl:value-of select="."/>	
									<br/>
								</xsl:for-each>	
								<xsl:for-each select="//cac:SellerSupplierParty"> 
									<b>&#160;&#160;&#160;&#160;&#160;&#160;Asıl Satıcı VKN: </b>
									<xsl:value-of select="cac:Party/cac:PartyIdentification/cbc:ID"/><br/>
									<b>&#160;&#160;&#160;&#160;&#160;&#160;Asıl Satıcı Ünvan: </b>
									<xsl:value-of select="cac:Party/cac:PartyName/cbc:Name"/><br/>
								</xsl:for-each>
								<xsl:for-each select="//cac:BuyerCustomerParty"> 
									<b>&#160;&#160;&#160;&#160;&#160;&#160;Asıl Alıcı VKN: </b>
									<xsl:value-of select="cac:Party/cac:PartyIdentification/cbc:ID"/><br/>
									<b>&#160;&#160;&#160;&#160;&#160;&#160;Asıl Alıcı Ünvan: </b>
									<xsl:value-of select="cac:Party/cac:PartyName/cbc:Name"/><br/>
								</xsl:for-each>	
								<xsl:for-each select="//cac:OriginatorCustomerParty"> 
									<b>&#160;&#160;&#160;&#160;&#160;&#160;İşlemleri Başlatan Alıcı VKN: </b>
									<xsl:value-of select="cac:Party/cac:PartyIdentification/cbc:ID"/><br/>
									<b>&#160;&#160;&#160;&#160;&#160;&#160;İşlemleri Başlatan Alıcı Ünvan: </b>
									<xsl:value-of select="cac:Party/cac:PartyName/cbc:Name"/><br/>
								</xsl:for-each>
								<xsl:for-each select="//cac:DespatchSupplierParty/cac:DespatchContact/cbc:Name">
									<b>&#160;&#160;&#160;&#160;&#160; Teslim Eden: </b>
									<xsl:apply-templates/>
									<xsl:text>&#160;</xsl:text>
									<br/>
								</xsl:for-each>
							</td>
							<td id="notesTableTd" height="100">
								<xsl:for-each select="//cac:CarrierParty">
									<b>&#160;&#160;&#160;&#160;&#160;&#160; Taşıyıcı Firma: </b>
									VKN: <xsl:value-of select="./cac:PartyIdentification/cbc:ID"/>, <xsl:value-of select="./cac:PartyName/cbc:Name"/>
									<br/>
								</xsl:for-each>
								<xsl:for-each select="//cac:ShipmentStage/cac:TransportMeans/cac:RoadTransport/cbc:LicensePlateID">
									<b>&#160;&#160;&#160;&#160;&#160;&#160; Araç plaka numarası: </b>
									<xsl:value-of select="."/>	
									<br/>
								</xsl:for-each>	
								<xsl:for-each select="//cac:TransportHandlingUnit/cac:TransportEquipment/cbc:ID[@schemeID = 'DORSEPLAKA']">
									<b>&#160;&#160;&#160;&#160;&#160;&#160; Dorse plaka numarası: </b>
									<xsl:value-of select="."/>	
									<br/>
								</xsl:for-each>	
								<xsl:for-each select="//cac:ShipmentStage/cac:DriverPerson">
									<xsl:if	test="cbc:FirstName">									
										<b>&#160;&#160;&#160;&#160;&#160;&#160; Şoför: </b>
														<xsl:for-each select="cbc:Title">
														<xsl:apply-templates/>
														<xsl:text>&#160;</xsl:text>
														</xsl:for-each>
														<xsl:for-each select="cbc:FirstName">
														<xsl:apply-templates/>
														<xsl:text>&#160;</xsl:text>
														</xsl:for-each>
														<xsl:for-each select="cbc:MiddleName">
														<xsl:apply-templates/>
														<xsl:text>&#160;</xsl:text>
														</xsl:for-each>
														<xsl:for-each select="cbc:FamilyName">
														<xsl:apply-templates/>
														<xsl:text>&#160;</xsl:text>
														</xsl:for-each>, TCKN:
														<xsl:for-each select="cbc:NationalityID">
														<xsl:apply-templates/>
														</xsl:for-each>
										<br/>
									</xsl:if>
								</xsl:for-each>
							</td>
						</tr>
					</tbody>
				</table>
				
				<table id="notesTable2" style="margin-top:2px; !important" width="800" align="left"  >
					<tr>
						<td style="color:#5a85a9" align="middle" >Bu Fatura E-Dönüşüm Merkezi EDM Teknolojileri ile Üretilmiştir</td>
					</tr>
				</table>
				
			</body>
		</html>
	</xsl:template>
	<xsl:template match="//n1:DespatchAdvice/cac:DespatchLine">
		<tr class="lineTableTr">
			<td class="lineTableTd">
				<xsl:text>&#160;</xsl:text>
				<xsl:value-of select="./cbc:ID"/>
			</td>
			<td class="lineTableTd">
				<xsl:text>&#160;</xsl:text>
				<xsl:value-of select="./cac:Item/cbc:Name"/>
			</td>
			<td class="lineTableTd" align="right">
				<xsl:text>&#160;</xsl:text>
				<xsl:value-of
					select="format-number(./cbc:DeliveredQuantity, '###.###,####', 'european')"/>
				<xsl:if test="./cbc:DeliveredQuantity/@unitCode">
					<xsl:for-each select="./cbc:DeliveredQuantity">
						<xsl:text> </xsl:text>
						<xsl:choose>
							<xsl:when test="@unitCode  = '26'">
								<xsl:text>ton</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'BX'">
								<xsl:text>Kutu</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'LTR'">
								<xsl:text>lt</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'C62'">
								<xsl:text>Adet</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'NIU'">
								<xsl:text>Adet</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'KGM'">
								<xsl:text>kg</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'KJO'">
								<xsl:text>kJ</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'GRM'">
								<xsl:text>g</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'MGM'">
								<xsl:text>mg</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'NT'">
								<xsl:text>Net Ton</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'GT'">
								<xsl:text>Gross Ton</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'MTR'">
								<xsl:text>m</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'MMT'">
								<xsl:text>mm</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'KTM'">
								<xsl:text>km</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'MLT'">
								<xsl:text>ml</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'MMQ'">
								<xsl:text>mm3</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'CLT'">
								<xsl:text>cl</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'CMK'">
								<xsl:text>cm2</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'CMQ'">
								<xsl:text>cm3</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'CMT'">
								<xsl:text>cm</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'MTK'">
								<xsl:text>m2</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'MTQ'">
								<xsl:text>m3</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'DAY'">
								<xsl:text> Gün</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'MON'">
								<xsl:text> Ay</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'PA'">
								<xsl:text> Paket</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'KWH'">
								<xsl:text> KWH</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'ANN'">
								<xsl:text> Yıl</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'HUR'">
								<xsl:text> Saat</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'D61'">
								<xsl:text> Dakika</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'D62'">
								<xsl:text> Saniye</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'CCT'">
								<xsl:text> Ton baş.taşıma kap.</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'D30'">
								<xsl:text> Brüt kalori</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'D40'">
								<xsl:text> 1000 lt</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'LPA'">
								<xsl:text> saf alkol lt</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'B32'">
								<xsl:text> kg.m2</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'NCL'">
								<xsl:text> hücre adet</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'PR'">
								<xsl:text> Çift</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'R9'">
								<xsl:text> 1000 m3</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'SET'">
								<xsl:text> Set</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'T3'">
								<xsl:text> 1000 adet</xsl:text>
							</xsl:when>							
						</xsl:choose>
					</xsl:for-each>
				</xsl:if>
			</td>
			<td class="lineTableTd" align="right">
				<xsl:text>&#160;</xsl:text>
				<xsl:value-of
					select="format-number(./cac:Shipment/cac:GoodsItem/cac:InvoiceLine/cac:Price/cbc:PriceAmount, '###.##0,########', 'european')"/>
				<xsl:if test="./cac:Shipment/cac:GoodsItem/cac:InvoiceLine/cac:Price/cbc:PriceAmount/@currencyID">
					<xsl:text> </xsl:text>
					<xsl:if test="./cac:Shipment/cac:GoodsItem/cac:InvoiceLine/cac:Price/cbc:PriceAmount/@currencyID = &quot;TRL&quot; or ./cac:Shipment/cac:GoodsItem/cac:InvoiceLine/cac:Price/cbc:PriceAmount/@currencyID = &quot;TRY&quot;">
						<xsl:text>TL</xsl:text>
					</xsl:if>
					<xsl:if test="./cac:Shipment/cac:GoodsItem/cac:InvoiceLine/cac:Price/cbc:PriceAmount/@currencyID != &quot;TRL&quot; and ./cac:Shipment/cac:GoodsItem/cac:InvoiceLine/cac:Price/cbc:PriceAmount/@currencyID != &quot;TRY&quot;">
						<xsl:value-of select="./cac:Shipment/cac:GoodsItem/cac:InvoiceLine/cac:Price/cbc:PriceAmount/@currencyID"/>
					</xsl:if>
				</xsl:if>
			</td>
			<td class="lineTableTd" align="right">
				<xsl:text>&#160;</xsl:text>
				<xsl:value-of
					select="format-number(./cbc:OutstandingQuantity, '###.###,####', 'european')"/>
				<xsl:if test="./cbc:OutstandingQuantity/@unitCode">
					<xsl:for-each select="./cbc:OutstandingQuantity">
						<xsl:text> </xsl:text>
						<xsl:choose>
							<xsl:when test="@unitCode  = '26'">
								<xsl:text>ton</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'BX'">
								<xsl:text>Kutu</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'LTR'">
								<xsl:text>lt</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'C62'">
								<xsl:text>Adet</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'NIU'">
								<xsl:text>Adet</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'KGM'">
								<xsl:text>kg</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'KJO'">
								<xsl:text>kJ</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'GRM'">
								<xsl:text>g</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'MGM'">
								<xsl:text>mg</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'NT'">
								<xsl:text>Net Ton</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'GT'">
								<xsl:text>Gross Ton</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'MTR'">
								<xsl:text>m</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'MMT'">
								<xsl:text>mm</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'KTM'">
								<xsl:text>km</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'MLT'">
								<xsl:text>ml</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'MMQ'">
								<xsl:text>mm3</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'CLT'">
								<xsl:text>cl</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'CMK'">
								<xsl:text>cm2</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'CMQ'">
								<xsl:text>cm3</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'CMT'">
								<xsl:text>cm</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'MTK'">
								<xsl:text>m2</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'MTQ'">
								<xsl:text>m3</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'DAY'">
								<xsl:text> Gün</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'MON'">
								<xsl:text> Ay</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'PA'">
								<xsl:text> Paket</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'KWH'">
								<xsl:text> KWH</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'ANN'">
								<xsl:text> Yıl</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'HUR'">
								<xsl:text> Saat</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'D61'">
								<xsl:text> Dakika</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'D62'">
								<xsl:text> Saniye</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'CCT'">
								<xsl:text> Ton baş.taşıma kap.</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'D30'">
								<xsl:text> Brüt kalori</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'D40'">
								<xsl:text> 1000 lt</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'LPA'">
								<xsl:text> saf alkol lt</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'B32'">
								<xsl:text> kg.m2</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'NCL'">
								<xsl:text> hücre adet</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'PR'">
								<xsl:text> Çift</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'R9'">
								<xsl:text> 1000 m3</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'SET'">
								<xsl:text> Set</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'T3'">
								<xsl:text> 1000 adet</xsl:text>
							</xsl:when>							
						</xsl:choose>
					</xsl:for-each>
				</xsl:if>
			</td>
			<td class="lineTableTd" align="right">
				<xsl:text>&#160;</xsl:text>
				<xsl:value-of
					select="format-number(./cac:Shipment/cac:GoodsItem/cac:InvoiceLine/cbc:LineExtensionAmount, '###.##0,########', 'european')"/>
				<xsl:if test="./cac:Shipment/cac:GoodsItem/cac:InvoiceLine/cbc:LineExtensionAmount/@currencyID">
					<xsl:text> </xsl:text>
					<xsl:if test="./cac:Shipment/cac:GoodsItem/cac:InvoiceLine/cbc:LineExtensionAmount/@currencyID = &quot;TRL&quot; or ./cac:Shipment/cac:GoodsItem/cac:InvoiceLine/cbc:LineExtensionAmount/@currencyID = &quot;TRY&quot;">
						<xsl:text>TL</xsl:text>
					</xsl:if>
					<xsl:if test="./cac:Shipment/cac:GoodsItem/cac:InvoiceLine/cbc:LineExtensionAmount/@currencyID != &quot;TRL&quot; and ./cac:Shipment/cac:GoodsItem/cac:InvoiceLine/cbc:LineExtensionAmount/@currencyID != &quot;TRY&quot;">
						<xsl:value-of select="./cac:Shipment/cac:GoodsItem/cac:InvoiceLine/cbc:LineExtensionAmount/@currencyID"/>
					</xsl:if>
				</xsl:if>
			</td>
		</tr>
	</xsl:template>
	<xsl:template match="//cbc:IssueDate">
		<xsl:value-of select="substring(.,9,2)"/>-<xsl:value-of select="substring(.,6,2)"/>-<xsl:value-of select="substring(.,1,4)"/>
	</xsl:template>
	<xsl:template match="//cbc:ActualDespatchDate">
		<xsl:value-of select="substring(.,9,2)"/>-<xsl:value-of select="substring(.,6,2)"/>-<xsl:value-of select="substring(.,1,4)"/>
	</xsl:template>
	<xsl:template match="//n1:DespatchAdvice">
		<tr class="lineTableTr">
			<td class="lineTableTd">
				<xsl:text>&#160;</xsl:text>
			</td>
			<td class="lineTableTd">
				<xsl:text>&#160;</xsl:text>
			</td>
			<td class="lineTableTd" align="right">
				<xsl:text>&#160;</xsl:text>
			</td>
			<td class="lineTableTd" align="right">
				<xsl:text>&#160;</xsl:text>
			</td>
			<td class="lineTableTd" align="right">
				<xsl:text>&#160;</xsl:text>
			</td>
			<td class="lineTableTd" align="right">
				<xsl:text>&#160;</xsl:text>
			</td>
		</tr>
	</xsl:template>
	<xsl:template name="Party_Title" >
		<xsl:param name="PartyType" />
		<td style="width:469px; " align="left">
			<xsl:if test="cac:PartyName">
				<xsl:value-of select="cac:PartyName/cbc:Name"/>
				<br/>
			</xsl:if>
			<xsl:for-each select="cac:Person">
				<xsl:for-each select="cbc:Title">
					<xsl:apply-templates/>
					<xsl:text>&#160;</xsl:text>
				</xsl:for-each>
				<xsl:for-each select="cbc:FirstName">
					<xsl:apply-templates/>
					<xsl:text>&#160;</xsl:text>
				</xsl:for-each>
				<xsl:for-each select="cbc:MiddleName">
					<xsl:apply-templates/>
					<xsl:text>&#160; </xsl:text>
				</xsl:for-each>
				<xsl:for-each select="cbc:FamilyName">
					<xsl:apply-templates/>
					<xsl:text>&#160;</xsl:text>
				</xsl:for-each>
				<xsl:for-each select="cbc:NameSuffix">
					<xsl:apply-templates/>
				</xsl:for-each>
				<xsl:if test="$PartyType='TAXFREE'">
					<br/>
					<xsl:text>Pasaport No: </xsl:text>
					<xsl:value-of select="cac:IdentityDocumentReference/cbc:ID"/>
					<br/>
					<xsl:text>Ülkesi: </xsl:text>
					<xsl:value-of select="cbc:NationalityID"/>	
				</xsl:if>
			</xsl:for-each>
		</td>		
	</xsl:template>
	<xsl:template name="Party_Adress" >
		<xsl:param name="PartyType" />
		<td style="width:469px; " align="left">
			<xsl:for-each select="cac:PostalAddress">
				<xsl:for-each select="cbc:StreetName">
					<xsl:apply-templates/>
					<xsl:text>&#160;</xsl:text>
				</xsl:for-each>
				<xsl:for-each select="cbc:BuildingName">
					<xsl:apply-templates/>
				</xsl:for-each>
				<xsl:for-each select="cbc:BuildingNumber">
					<xsl:text> No:</xsl:text>
					<xsl:apply-templates/>
					<xsl:text>&#160;</xsl:text>
				</xsl:for-each>
				<br/>
				<xsl:for-each select="cbc:Room">
					<xsl:text>Kapı No:</xsl:text>
					<xsl:apply-templates/>
					<xsl:text>&#160;</xsl:text>
				</xsl:for-each>
				<br/>
				<xsl:for-each select="cbc:PostalZone">
					<xsl:apply-templates/>
					<xsl:text>&#160;</xsl:text>
				</xsl:for-each>
				<xsl:for-each select="cbc:CitySubdivisionName">
					<xsl:apply-templates/>
					<xsl:text>/ </xsl:text>
				</xsl:for-each>
				<xsl:for-each select="cbc:CityName">
					<xsl:apply-templates/>
					<xsl:text>&#160;</xsl:text>
				</xsl:for-each>
				<xsl:if test="$PartyType='TAXFREE'">
					<br/>
					<xsl:value-of select="cac:Country/cbc:Name"/>
					<br/>
				</xsl:if>
			</xsl:for-each>
		</td>
	</xsl:template>
	<xsl:template name='Party_Other'>
		<xsl:param name="PartyType" />
		<xsl:for-each select="cbc:WebsiteURI">
			<tr align="left">
				<td>
					<xsl:text>Web Sitesi: </xsl:text>
					<xsl:value-of select="."/>
				</td>
			</tr>
		</xsl:for-each>
		<xsl:for-each select="cac:Contact/cbc:ElectronicMail">
			<tr align="left">
				<td>
					<xsl:text>E-Posta: </xsl:text>
					<xsl:value-of select="."/>
				</td>
			</tr>
		</xsl:for-each>	
		<xsl:for-each select="cac:Contact">
			<xsl:if test="cbc:Telephone or cbc:Telefax">
				<tr align="left">
					<td style="width:469px; " align="left">
						<xsl:for-each select="cbc:Telephone">
							<xsl:text>Tel: </xsl:text>
							<xsl:apply-templates/>
						</xsl:for-each>
						<xsl:for-each select="cbc:Telefax">
							<xsl:text> Fax: </xsl:text>
							<xsl:apply-templates/>
						</xsl:for-each>
						<xsl:text>&#160;</xsl:text>
					</td>
				</tr>
			</xsl:if>
		</xsl:for-each>
		<xsl:if test="$PartyType!='TAXFREE'">
			<xsl:for-each select="cac:PartyTaxScheme/cac:TaxScheme/cbc:Name">
				<tr align="left">
					<td>
						<xsl:text>Vergi Dairesi: </xsl:text>
						<xsl:apply-templates/>
					</td>
				</tr>
			</xsl:for-each>
			<xsl:for-each select="cac:PartyIdentification">
			<tr align="left">
				<td>
					<xsl:value-of select="cbc:ID/@schemeID"/>
					<xsl:text>: </xsl:text>
					<xsl:value-of select="cbc:ID"/>
				</td>
			</tr>
			</xsl:for-each>
		</xsl:if>
		<tr align="left">
			<td>
				<xsl:for-each select="//cac:DeliveryAddress">
					<b>Teslimat Adresi:</b>
					<br/>
					<xsl:for-each select="cbc:BuildingName">
						<xsl:apply-templates/>
					</xsl:for-each>
					<br/>
					<xsl:for-each select="cbc:CitySubdivisionName">
						<xsl:apply-templates/>
					</xsl:for-each>
					<xsl:text>/ </xsl:text>
					<xsl:for-each select="cbc:CityName">
						<xsl:apply-templates/>
						<xsl:text>&#160;</xsl:text>
					</xsl:for-each>
				</xsl:for-each>
			</td>
		</tr>
	</xsl:template>
	<xsl:template name="Curr_Type">
		<xsl:value-of select="format-number(., '###.##0,00', 'european')"/>		
		<xsl:if	test="@currencyID">
			<xsl:text> </xsl:text>
			<xsl:choose>
				<xsl:when test="@currencyID = 'TRL' or @currencyID = 'TRY'">
					<xsl:text>TL</xsl:text>					
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="@currencyID"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:if>		
	</xsl:template>
</xsl:stylesheet>
