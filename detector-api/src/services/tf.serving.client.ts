import * as config from 'config';
import * as grpc from 'grpc';
import { injectable } from 'inversify';

@injectable()
export class TfServingClient {
    private readonly PROTO_PATH = __dirname + '/../protos/prediction_service.proto';
    // tslint:disable-next-line:no-any
    private tfServing: any = grpc.load(this.PROTO_PATH).tensorflow.serving;
    private tfServerUrl: string;
    private modelName: string;
    private signatureName: string;
    // tslint:disable-next-line:no-any
    private client: any;

    constructor() {
        this.modelName = config.get<string>('model.name');
        this.signatureName = config.get<string>('model.signature_name');
        this.tfServerUrl = config.get<string>('tf_serving.host') + ':' +
                           config.get<number>('tf_serving.port').toString();
        this.client = new this.tfServing.PredictionService(
            this.tfServerUrl, grpc.credentials.createInsecure());
    }

    // tslint:disable-next-line:no-any
    public async predictDogBreed(imageData: any): Promise<string> {
        // create image buffer for prediction - it must be an array of images
        // tslint:disable-next-line:no-any
        const buffer = new Array<any>(imageData);

        // build protobuf for predict request
        const predictRequest = this.buildPredictRequest(buffer);

        // issue a request
        // tslint:disable-next-line:no-any
        const predictResult: Promise<any> = new Promise<any>((resolve, reject) => {
            this.client.predict(predictRequest, (error, response) => {
                if (error) {
                    console.log(`Error occurred: ${error}`);
                    reject(error);
                } else {
                    console.log(response);
                    resolve('Dog breed detected');
                }
            });
        });

        return predictResult;
    }

    // tslint:disable-next-line:no-any
    private buildPredictRequest(buffer: Array<any>): Object {
        const request = {
            model_spec: {
                name: this.modelName,
                signature_name: this.signatureName,
            },
            inputs: {
                examples: {
                    dtype: 'DT_STRING',
                    tensor_shape: {
                        dim: {
                            size: buffer.length,
                        },
                    },
                    string_val: buffer,
                },
            },
        };
        return request;
    }
}